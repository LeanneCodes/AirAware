const express = require("express");
const request = require("supertest");


jest.mock("../../../controllers/dashboardController", () => ({
  getDashboard: jest.fn(),
  refreshDashboard: jest.fn(),
}));

jest.mock("../../../middleware/authMiddleware", () => jest.fn());

const dashboardController = require("../../../controllers/dashboardController");
const authMiddleware = require("../../../middleware/authMiddleware");
const dashboardRoutes = require("../../../routers/dashboardRoutes");

function makeApp() {
  const app = express();
  app.use(express.json());

  app.use("/api/dashboard", authMiddleware, dashboardRoutes);

  app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message || "Server error" });
  });

  return app;
}


describe("Integration: dashboardRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /dashboard runs authMiddleware then calls getDashboard", async () => {
    const callOrder = [];

    authMiddleware.mockImplementation((req, res, next) => {
      callOrder.push("middleware");
      req.user = { id: 1, email: "user@example.com" };
      next();
    });

    dashboardController.getDashboard.mockImplementation((req, res) => {
      callOrder.push("controller");
      return res.status(200).json({
        ok: true,
        user: req.user,
      });
    });

    const app = makeApp();

const res = await request(app).get("/api/dashboard");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      user: { id: 1, email: "user@example.com" },
    });

    expect(authMiddleware).toHaveBeenCalledTimes(1);
    expect(dashboardController.getDashboard).toHaveBeenCalledTimes(1);

    expect(callOrder).toEqual(["middleware", "controller"]);
  });

  test("POST /dashboard/refresh runs authMiddleware then calls refreshDashboard", async () => {
    const callOrder = [];

    authMiddleware.mockImplementation((req, res, next) => {
      callOrder.push("middleware");
      req.user = { id: 2, email: "refresh@example.com" };
      next();
    });

    dashboardController.refreshDashboard.mockImplementation((req, res) => {
      callOrder.push("controller");
      return res.status(200).json({
        ok: true,
        refreshedFor: req.user.id,
      });
    });

    const app = makeApp();

const res = await request(app)
  .post("/api/dashboard/refresh")
  .send({ force: true });


    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      refreshedFor: 2,
    });

    expect(authMiddleware).toHaveBeenCalledTimes(1);
    expect(dashboardController.refreshDashboard).toHaveBeenCalledTimes(1);

    const [reqArg] = dashboardController.refreshDashboard.mock.calls[0];
    expect(reqArg.user).toEqual({ id: 2, email: "refresh@example.com" });

    expect(callOrder).toEqual(["middleware", "controller"]);
  });
});