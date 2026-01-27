const express = require("express");
const router = express.Router();

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// 1) city -> lat/lon
async function geocodeCity(city) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OPENWEATHER_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return { lat: data[0].lat, lon: data[0].lon, name: data[0].name, country: data[0].country };
}

// 2) lat/lon + start/end -> history
async function fetchAirHistory(lat, lon, hours) {
  const end = Math.floor(Date.now() / 1000);
  const start = end - hours * 3600;

  const url =
    `https://api.openweathermap.org/data/2.5/air_pollution/history` +
    `?lat=${lat}&lon=${lon}&start=${start}&end=${end}&appid=${OPENWEATHER_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) throw new Error(JSON.stringify(data));

  // Normalize to what frontend needs
  const points = (data.list || []).map((r) => ({
    ts: r.dt * 1000, // ms for JS Date
    aqi: r.main?.aqi ?? null,
    pm25: r.components?.pm2_5 ?? null,
    pm10: r.components?.pm10 ?? null,
    no2: r.components?.no2 ?? null,
    o3: r.components?.o3 ?? null,
    so2: r.components?.so2 ?? null,
    co: r.components?.co ?? null,
  }));

  return { start, end, points };
}

router.get("/trends", async (req, res) => {
  try {
    const city = (req.query.city || "").trim();
    const hours = Number(req.query.hours || 12);

    if (!city) return res.status(400).json({ error: "city is required" });
    if (!Number.isFinite(hours) || hours < 1 || hours > 120)
      return res.status(400).json({ error: "hours must be 1..120" });

    const geo = await geocodeCity(city);
    if (!geo) return res.status(404).json({ error: "City not found" });

    const history = await fetchAirHistory(geo.lat, geo.lon, hours);

    res.json({
      city,
      resolved: geo,
      hours,
      ...history,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trends", detail: String(err.message || err) });
  }
});

module.exports = router;