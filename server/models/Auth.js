const db = require("../db/connect");

async function createUser({ email, passwordHash, conditionType, sensitivityLevel }) {
  const result = await db.query(
    `INSERT INTO users (email, password_hash, condition_type, sensitivity_level)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, condition_type, sensitivity_level, created_at`,
    [email, passwordHash, conditionType, sensitivityLevel]
  );
  return result.rows[0];
}

async function getUserByEmail(email) {
  const result = await db.query(
    `SELECT id, email, password_hash, condition_type, sensitivity_level
     FROM users
     WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
}

async function getUserById(id) {
  const result = await db.query(
    `SELECT id, email, condition_type, sensitivity_level
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