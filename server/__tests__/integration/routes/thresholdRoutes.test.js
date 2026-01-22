const express = require("express");
const request = require("supertest");

// Mock the controller that the router imports
jest.mock("../../../controllers/thresholdController", () => ({
  getThresholds: jest.fn(),
  setThresholds: jest.fn(),
  updateThresholds: jest.fn(),
  getDefaultThresholds: jest.fn(),
}));

const thresholdController = require("../../../controllers/thresholdController");
const thresholdRoutes = require("../../../routers/thresholdRoutes");

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/thresholds", thresholdRoutes);
  return app;
}

describe("Integration: thresholdRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/thresholds calls thresholdController.getThresholds", async () => {
    thresholdController.getThresholds.mockImplementation((req, res) => {
      return res.status(200).json({ ok: true, route: "getThresholds" });
    });

    const app = makeApp();
    const res = await request(app).get("/api/thresholds");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, route: "getThresholds" });

    expect(thresholdController.getThresholds).toHaveBeenCalledTimes(1);
  });

  test("POST /api/thresholds calls thresholdController.setThresholds", async () => {
    thresholdController.setThresholds.mockImplementation((req, res) => {
      return res
        .status(201)
        .json({ ok: true, route: "setThresholds", body: req.body });
    });

    const app = makeApp();
    const payload = { pm25: 12, no2: 40 };

    const res = await request(app).post("/api/thresholds").send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      ok: true,
      route: "setThresholds",
      body: payload,
    });

    expect(thresholdController.setThresholds).toHaveBeenCalledTimes(1);
    const [reqArg] = thresholdController.setThresholds.mock.calls[0];
    expect(reqArg.body).toEqual(payload);
  });

  test("PATCH /api/thresholds calls thresholdController.updateThresholds", async () => {
    thresholdController.updateThresholds.mockImplementation((req, res) => {
      return res
        .status(200)
        .json({ ok: true, route: "updateThresholds", body: req.body });
    });

    const app = makeApp();
    const payload = { pm25: 10 };

    const res = await request(app).patch("/api/thresholds").send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      route: "updateThresholds",
      body: payload,
    });

    expect(thresholdController.updateThresholds).toHaveBeenCalledTimes(1);
    const [reqArg] = thresholdController.updateThresholds.mock.calls[0];
    expect(reqArg.body).toEqual(payload);
  });

  test("GET /api/thresholds/defaults calls thresholdController.getDefaultThresholds", async () => {
    thresholdController.getDefaultThresholds.mockImplementation((req, res) => {
      return res
        .status(200)
        .json({ ok: true, route: "getDefaultThresholds" });
    });

    const app = makeApp();
    const res = await request(app).get("/api/thresholds/defaults");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      route: "getDefaultThresholds",
    });

    expect(thresholdController.getDefaultThresholds).toHaveBeenCalledTimes(1);
  });
});
