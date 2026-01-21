const db = require('../db/connect');

/**
 * Fetch raw air pollution data from OpenWeather
 */
async function getPollutionData(lat, lon) {
  if (!lat || !lon) {
    throw new Error('Latitude and longitude are required');
  }

  const url =
    `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Air quality API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch latest air quality and store it in the database
 * Used by dashboard refresh
 */
async function fetchAndStoreReading({ areaLabel, latitude, longitude }) {
  const data = await getPollutionData(latitude, longitude);

  const point = data?.list?.[0];
  if (!point) {
    throw new Error('No air quality data returned');
  }

  const observedAt = new Date(point.dt * 1000);
  const aqi = point.main?.aqi ?? null;

  const c = point.components || {};
  const pm25 = c.pm2_5 ?? null;
  const pm10 = c.pm10 ?? null;
  const no2 = c.no2 ?? null;
  const o3  = c.o3  ?? null;
  const so2 = c.so2 ?? null;
  const co  = c.co  ?? null;

  // prevents duplicates
  const existing = await db.query(
    `SELECT id
     FROM air_quality_readings
     WHERE area_label = $1 AND observed_at = $2
     LIMIT 1`,
    [areaLabel, observedAt]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const insert = await db.query(
    `INSERT INTO air_quality_readings (
       source,
       area_label,
       latitude,
       longitude,
       observed_at,
       pm25,
       pm10,
       no2,
       o3,
       so2,
       co,
       aqi
     )
     VALUES (
       'public_api',
       $1, $2, $3, $4,
       $5, $6, $7, $8, $9, $10, $11
     )
     RETURNING id`,
    [
      areaLabel,
      latitude,
      longitude,
      observedAt,
      pm25,
      pm10,
      no2,
      o3,
      so2,
      co,
      aqi,
    ]
  );

  return insert.rows[0].id;
}

module.exports = {
  getPollutionData,
  fetchAndStoreReading,
};