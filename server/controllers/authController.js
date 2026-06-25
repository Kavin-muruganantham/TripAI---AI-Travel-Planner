const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const { findUserByEmail, saveUser } = require('../utils/authStore');

const buildUserPayload = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

exports.register = async (req, res) => {
  try {
    console.log('Register request body:', req.body);

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server configuration error: JWT secret is missing' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = {
      id: randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };
    await saveUser(user);

    const token = jwt.sign({ userId: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: buildUserPayload(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    console.error('❌ Registration error:', error.message);
    res.status(500).json({ success: false, message: 'Registration failed: ' + error.message });
  }
};

exports.login = async (req, res) => {
  try {
    console.log('🔐 Login attempt for:', req.body.email);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: 'Server configuration error: JWT secret is missing' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ success: false, message: 'No account found with this email. Please sign up first.' });
    }

    console.log('✅ User found:', user.name);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Password mismatch for:', email);
      return res.status(400).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    console.log('✅ Password matched for:', user.name);

    const token = jwt.sign({ userId: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    console.log('✅ JWT token generated for:', user.name);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: buildUserPayload(user),
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login: ' + error.message });
  }
};
