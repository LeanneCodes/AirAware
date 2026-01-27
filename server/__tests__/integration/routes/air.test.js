const express = require("express");
const request = require("supertest");

beforeAll(() => {
  global.fetch = jest.fn();
});

afterAll(() => {
  jest.restoreAllMocks();
});

const airRouter = require("../../../routers/air.js");

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/air", airRouter);

  // error handler (optional, helps debugging)
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message || "Server error" });
  });

  return app;
}

function mockFetchOnce({ ok = true, json }) {
  global.fetch.mockResolvedValueOnce({
    ok,
    json: jest.fn().mockResolvedValue(json),
  });
}

describe("Integration: air router (/api/air)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENWEATHER_API_KEY = "test_key";
  });

  test("GET /api/air/trends -> 400 when city is missing", async () => {
    const app = makeApp();

    const res = await request(app).get("/api/air/trends");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "city is required" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("GET /api/air/trends -> 400 when hours is out of range", async () => {
    const app = makeApp();

    const res = await request(app).get("/api/air/trends?city=London&hours=0");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "hours must be 1..120" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("GET /api/air/trends -> 404 when city not found", async () => {
    // geocode returns []
    mockFetchOnce({ ok: true, json: [] });

    const app = makeApp();

    const res = await request(app).get("/api/air/trends?city=NoSuchCity&hours=12");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "City not found" });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(String(global.fetch.mock.calls[0][0])).toContain("/geo/1.0/direct");
  });

  test("GET /api/air/trends -> 200 returns normalized points", async () => {
    // 1) geocode
    mockFetchOnce({
      ok: true,
      json: [{ lat: 51.5072, lon: -0.1276, name: "London", country: "GB" }],
    });

    // 2) history
    mockFetchOnce({
      ok: true,
      json: {
        list: [
          {
            dt: 1700000000,
            main: { aqi: 2 },
            components: {
              pm2_5: 10.5,
              pm10: 15.2,
              no2: 20.1,
              o3: 30.4,
              so2: 5.6,
              co: 200.0,
            },
          },
          {
            dt: 1700003600,
            main: { aqi: 3 },
            components: { pm2_5: 12.0, pm10: 18.0 },
          },
        ],
      },
    });

    const app = makeApp();

    const res = await request(app).get("/api/air/trends?city=London&hours=12");

    expect(res.status).toBe(200);

    // check top-level shape
    expect(res.body.city).toBe("London");
    expect(res.body.hours).toBe(12);
    expect(res.body.resolved).toEqual({
      lat: 51.5072,
      lon: -0.1276,
      name: "London",
      country: "GB",
    });

    // start/end present (computed with Date.now)
    expect(typeof res.body.start).toBe("number");
    expect(typeof res.body.end).toBe("number");
    expect(Array.isArray(res.body.points)).toBe(true);
    expect(res.body.points.length).toBe(2);

    // normalized point fields
    expect(res.body.points[0]).toEqual({
      ts: 1700000000 * 1000,
      aqi: 2,
      pm25: 10.5,
      pm10: 15.2,
      no2: 20.1,
      o3: 30.4,
      so2: 5.6,
      co: 200.0,
    });

    // missing components become null
    expect(res.body.points[1]).toEqual({
      ts: 1700003600 * 1000,
      aqi: 3,
      pm25: 12.0,
      pm10: 18.0,
      no2: null,
      o3: null,
      so2: null,
      co: null,
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test("GET /api/air/trends -> 500 when OpenWeather history request fails", async () => {
    // 1) geocode ok
    mockFetchOnce({
      ok: true,
      json: [{ lat: 1, lon: 2, name: "X", country: "YY" }],
    });

    // 2) history not ok
    mockFetchOnce({
      ok: false,
      json: { message: "bad request" },
    });

    const app = makeApp();

    const res = await request(app).get("/api/air/trends?city=X&hours=12");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch trends");
    expect(typeof res.body.detail).toBe("string");

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
