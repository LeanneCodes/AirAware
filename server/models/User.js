const db = require("../db/connect");

async function getById(userId) {
  const { rows } = await db.query(
    `
    SELECT
      id,
      email,
      first_name,
      last_name,
      date_of_birth,
      sex_at_birth,
      gender,
      nationality,
      condition_type,
      sensitivity_level,
      accessibility_mode,
      analytics_opt_in,
      accepted_disclaimer_at,
      created_at,
      updated_at
    FROM users
    WHERE id = $1
    `,
    [userId]
  );

  return rows[0] || null;
}

async function updateById(userId, updates) {
  const allowedFields = new Set([
    "condition_type",
    "sensitivity_level",
    "accessibility_mode",
    "analytics_opt_in",
    "accepted_disclaimer_at",
    "first_name",
    "last_name",
    "date_of_birth",
    "sex_at_birth",
    "gender",
    "nationality",
  ]);

  const keys = Object.keys(updates).filter((k) => allowedFields.has(k));
  if (keys.length === 0) return getById(userId);

  const setParts = [];
  const values = [];
  let i = 1;

  for (const key of keys) {
    setParts.push(`${key} = $${i}`);
    values.push(updates[key]);
    i++;
  }

  setParts.push(`updated_at = NOW()`);
  values.push(userId);

  const { rows } = await db.query(
  `
  UPDATE users
  SET ${setParts.join(", ")}
  WHERE id = $${i}
  RETURNING *
  `,
  values
);

  return rows[0] || null;
}

module.exports = {
  getById,
  updateById,
};
