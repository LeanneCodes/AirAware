const db = require("../db/connect");

async function createUser({ email, passwordHash }) {
  const result = await db.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email, created_at`,
    [email, passwordHash]
  );

  return result.rows[0];
}

async function getUserByEmail(email) {
  const result = await db.query(
    `SELECT id, email, password_hash
     FROM users
     WHERE email = $1`,
    [email]
  );

  return result.rows[0] || null;
}

async function getUserById(id) {
  const result = await db.query(
    `SELECT id, email
     FROM users
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
};
