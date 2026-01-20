const db = require('../db/connect');

class Threshold {
  constructor({ id, user_id, trigger_aqi, use_default, updated_at }) {
    this.id = id;
    this.userId = user_id;
    this.triggerAqi = trigger_aqi === null ? null : Number(trigger_aqi);
    this.useDefault = use_default;
    this.updatedAt = updated_at;
  }

  /*
   * Controller: getThresholds
   */
  static async getByUserId(userId) {
    const response = await db.query(
      `
      SELECT id, user_id, trigger_aqi, use_default, updated_at
      FROM thresholds
      WHERE user_id = $1;
      `,
      [userId]
    );

    if (!response.rows.length) return null;
    return new Threshold(response.rows[0]);
  }

  /*
   * Controller: setThresholds
   */
  static async newThresholds({ userId, triggerAqi, useDefault }) {
    const response = await db.query(
      `
      INSERT INTO thresholds (user_id, trigger_aqi, use_default, updated_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, user_id, trigger_aqi, use_default, updated_at;
      `,
      [userId, triggerAqi, useDefault]
    );

    return new Threshold(response.rows[0]);
  }

  /*
   * Controller: updateThresholds
   */
  static async updateThresholdsByUserId({ userId, triggerAqi, useDefault }) {
    const response = await db.query(
      `
      UPDATE thresholds
      SET trigger_aqi = $1,
          use_default = $2,
          updated_at = NOW()
      WHERE user_id = $3
      RETURNING id, user_id, trigger_aqi, use_default, updated_at;
      `,
      [triggerAqi, useDefault, userId]
    );

    if (!response.rows.length) return null;
    return new Threshold(response.rows[0]);
  }
}

module.exports = Threshold;