const express = require("express");
const request = require("supertest");

// Mock the controller that the router imports
jest.mock("../../../controllers/locationController", () => ({
  getLocation: jest.fn(),
  getLocationHistory: jest.fn(),
  setLocation: jest.fn(),
  updateLocation: jest.fn(),
  selectLocation: jest.fn(),
  deleteLocation: jest.fn(),
}));

const locationController = require("../../../controllers/locationController");
const locationRoutes = require("../../../routers/locationRoutes");

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/location", locationRoutes);
  return app;
}

describe("Integration: locationRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/location calls locationController.getLocation", async () => {
    locationController.getLocation.mockImplementation((req, res) => {
      return res.status(200).json({ ok: true, route: "getLocation" });
    });

    const app = makeApp();
    const res = await request(app).get("/api/location");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, route: "getLocation" });

    expect(locationController.getLocation).toHaveBeenCalledTimes(1);
  });

  test("GET /api/location/history calls locationController.getLocationHistory", async () => {
    locationController.getLocationHistory.mockImplementation((req, res) => {
      return res.status(200).json({ ok: true, route: "getLocationHistory" });
    });

    const app = makeApp();
    const res = await request(app).get("/api/location/history");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, route: "getLocationHistory" });

    expect(locationController.getLocationHistory).toHaveBeenCalledTimes(1);
  });

  test("POST /api/location calls locationController.setLocation", async () => {
    locationController.setLocation.mockImplementation((req, res) => {
      return res.status(201).json({ ok: true, route: "setLocation", body: req.body });
    });

    const app = makeApp();
    const payload = { city: "London", country: "UK" };

    const res = await request(app).post("/api/location").send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true, route: "setLocation", body: payload });

    expect(locationController.setLocation).toHaveBeenCalledTimes(1);
    const [reqArg] = locationController.setLocation.mock.calls[0];
    expect(reqArg.body).toEqual(payload);
  });

  test("PATCH /api/location calls locationController.updateLocation", async () => {
    locationController.updateLocation.mockImplementation((req, res) => {
      return res.status(200).json({ ok: true, route: "updateLocation", body: req.body });
    });

    const app = makeApp();
    const payload = { city: "Manchester" };

    const res = await request(app).patch("/api/location").send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, route: "updateLocation", body: payload });

    expect(locationController.updateLocation).toHaveBeenCalledTimes(1);
    const [reqArg] = locationController.updateLocation.mock.calls[0];
    expect(reqArg.body).toEqual(payload);
  });

  test("DELETE /api/location/:id calls locationController.deleteLocation", async () => {
    locationController.deleteLocation.mockImplementation((req, res) => {
      return res.status(200).json({ ok: true, route: "deleteLocation", id: req.params.id });
    });

    const app = makeApp();
    const res = await request(app).delete("/api/location/123");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, route: "deleteLocation", id: "123" });

    expect(locationController.deleteLocation).toHaveBeenCalledTimes(1);
    const [reqArg] = locationController.deleteLocation.mock.calls[0];
    expect(reqArg.params.id).toBe("123");
  });
});
