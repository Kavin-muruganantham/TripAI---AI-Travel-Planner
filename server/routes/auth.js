const express = require('express');
const { findUserByEmail } = require('../utils/authStore');
const { register, login } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.get('/check/:email', async (req, res) => {
	try {
		const email = req.params.email.toLowerCase().trim();
		const user = await findUserByEmail(email);

		if (user) {
			res.json({ exists: true, name: user.name, email: user.email, createdAt: user.createdAt });
			return;
		}

		res.json({ exists: false, message: 'User not found in database' });
	} catch (error) {
		res.status(500).json({ exists: false, message: 'Failed to check user', error: error.message });
	}
});

module.exports = router;
