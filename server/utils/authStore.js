const { query, findOne } = require('./mysql');

function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function findUserByEmail(email) {
  const normalizedEmail = email.toLowerCase().trim();
  return findOne('SELECT id, name, email, password, created_at AS createdAt FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
}

async function saveUser(user) {
  const createdAt = formatDateTime(user.createdAt || new Date());

  await query(
    'INSERT INTO users (id, name, email, password, created_at) VALUES (?, ?, ?, ?, ?)',
    [user.id, user.name, user.email.toLowerCase().trim(), user.password, createdAt]
  );

  return { ...user, createdAt };
}

module.exports = {
  findUserByEmail,
  saveUser,
};