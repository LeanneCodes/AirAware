const db = require("../db/connect");

class Location {
  constructor({ id, user_id, label, latitude, longitude, is_home, created_at }) {
    this.id = id;
    this.userId = user_id;
    this.label = label;
    this.latitude = Number(latitude);
    this.longitude = Number(longitude);
    this.isHome = is_home;
    this.createdAt = created_at;
  }

  static async resolveLocation(data) {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) throw new Error("Missing OpenWeather API key");

    const city = data.city ? data.city.trim() : null;
    const postcode = data.postcode
      ? data.postcode.trim().toUpperCase().replace(/\s+/g, " ")
      : null;

    if ((!city && !postcode) || (city && postcode)) {
      throw new Error("Provide either a city or a postcode");
    }

    if (city) {
      const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)},GB&limit=1&appid=${apiKey}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to resolve city");

      const results = await response.json();
      if (!results.length) throw new Error("City not found");

      return {
        label: `${results[0].name}, ${results[0].country}`,
        latitude: results[0].lat,
        longitude: results[0].lon,
      };
    }

    const url = `https://api.openweathermap.org/geo/1.0/zip?zip=${encodeURIComponent(postcode)},GB&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to resolve postcode");

    const result = await response.json();

    const reverseUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${result.lat}&lon=${result.lon}&limit=1&appid=${apiKey}`;
    const reverseResponse = await fetch(reverseUrl);

    let label = `${postcode}, ${result.country}`;
    if (reverseResponse.ok) {
      const reverseData = await reverseResponse.json();
      if (reverseData.length && reverseData[0].name) {
        label = `${reverseData[0].name}, ${result.country}`;
      }
    }

    return {
      label,
      latitude: result.lat,
      longitude: result.lon,
    };
  }

  static async getActiveLocationRow(userId) {
    const response = await db.query(
      `
      SELECT *
      FROM locations
      WHERE user_id = $1
      ORDER BY is_home DESC, created_at DESC
      LIMIT 1;
      `,
      [userId]
    );

    return response.rows[0] || null;
  }

  static async getLocationByUserId(userId) {
    const row = await Location.getActiveLocationRow(userId);
    if (!row) return null;
    return new Location(row);
  }

  static async newLocation(data) {
    const userId = data.userId;
    const resolved = await Location.resolveLocation(data);

    await db.query(
      `
      UPDATE locations
      SET is_home = FALSE
      WHERE user_id = $1 AND is_home = TRUE;
      `,
      [userId]
    );

    const response = await db.query(
      `
      INSERT INTO locations (user_id, label, latitude, longitude, is_home)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
      `,
      [userId, resolved.label, resolved.latitude, resolved.longitude, true]
    );

    return new Location(response.rows[0]);
  }

  static async updateLocationByUserId(data) {
    const userId = data.userId;

    const current = await Location.getActiveLocationRow(userId);
    if (!current) return null;

    const resolved = await Location.resolveLocation(data);

    const response = await db.query(
      `
      UPDATE locations
      SET label = $1,
          latitude = $2,
          longitude = $3
      WHERE id = $4
      RETURNING *;
      `,
      [resolved.label, resolved.latitude, resolved.longitude, current.id]
    );

    return new Location(response.rows[0]);
  }

  static async deleteLocationByUserId(userId) {
    const current = await Location.getActiveLocationRow(userId);
    if (!current) return null;

    const response = await db.query(
      `
      DELETE FROM locations
      WHERE id = $1
      RETURNING *;
      `,
      [current.id]
    );

    return new Location(response.rows[0]);
  }

    static async deleteClusterById({ userId, locationId }) {
    const { rows: found } = await db.query(
        `SELECT id, latitude, longitude, is_home
        FROM locations
        WHERE id = $1 AND user_id = $2
        LIMIT 1;`,
        [locationId, userId]
    );

    if (!found[0]) return null;

    const { latitude, longitude, is_home } = found[0];

    // 2) Delete ALL rows for this user that match that lat/lon (removes duplicates)
    const { rows: deletedRows } = await db.query(
        `DELETE FROM locations
        WHERE user_id = $1
        AND latitude = $2
        AND longitude = $3
        RETURNING is_home;`,
        [userId, latitude, longitude]
    );

    const deletedCount = deletedRows.length;
    const deletedHome = deletedRows.some((r) => r.is_home === true);

    return { deletedCount, deletedHome };
    }

  /**
   * Returns unique locations (by lat/lon) for the saved searches list.
   */
  static async getUniqueByUserId(userId) {
    const response = await db.query(
      `
      SELECT DISTINCT ON (latitude, longitude)
        id, user_id, label, latitude, longitude, is_home, created_at
      FROM locations
      WHERE user_id = $1
      ORDER BY latitude, longitude, created_at DESC;
      `,
      [userId]
    );

    const list = response.rows.map((row) => new Location(row));

    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    list.sort((a, b) => Number(b.isHome) - Number(a.isHome) || (new Date(b.createdAt) - new Date(a.createdAt)));

    return list;
  }

  static async setHomeById({ userId, locationId }) {
    const { rows: exists } = await db.query(
      `SELECT id FROM locations WHERE id = $1 AND user_id = $2 LIMIT 1;`,
      [locationId, userId]
    );

    if (!exists[0]) return null;

    await db.query(
      `UPDATE locations SET is_home = FALSE WHERE user_id = $1 AND is_home = TRUE;`,
      [userId]
    );

    const { rows } = await db.query(
      `
      UPDATE locations
      SET is_home = TRUE
      WHERE id = $1 AND user_id = $2
      RETURNING *;
      `,
      [locationId, userId]
    );

    return rows[0] ? new Location(rows[0]) : null;
  }
}

module.exports = Location;
