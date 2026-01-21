const express = require("express");
const request = require("supertest");

jest.mock("../../../controllers/authController", () => ({
  register: jest.fn(),
  login: jest.fn(),
  me: jest.fn(),
}));

jest.mock("../../../middleware/authMiddleware", () => jest.fn());

const authController = require("../../../controllers/authController");
const authMiddleware = require("../../../middleware/authMiddleware");
const authRoutes = require("../../../routers/authRoutes");

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/auth", authRoutes);

  app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message || "Server error" });
  });

  return app;
}

describe("Integration: authRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST /auth/register calls authController.register", async () => {
    authController.register.mockImplementation((req, res) => {
      return res.status(201).json({ ok: true, route: "register" });
    });

    const app = makeApp();

    const res = await request(app)
      .post("/auth/register")
      .send({ email: "test@example.com", password: "pass123" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true, route: "register" });

    expect(authController.register).toHaveBeenCalledTimes(1);
    const [reqArg] = authController.register.mock.calls[0];
    expect(reqArg.body).toEqual({ email: "test@example.com", password: "pass123" });
  });

  test("POST /auth/login calls authController.login", async () => {
    authController.login.mockImplementation((req, res) => {
      return res.status(200).json({ ok: true, route: "login" });
    });

    const app = makeApp();

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@example.com", password: "pass123" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, route: "login" });

    expect(authController.login).toHaveBeenCalledTimes(1);
    const [reqArg] = authController.login.mock.calls[0];
    expect(reqArg.body).toEqual({ email: "test@example.com", password: "pass123" });
  });

  test("GET /auth/me runs authMiddleware then calls authController.me", async () => {

    const callOrder = [];

    authMiddleware.mockImplementation((req, res, next) => {
      callOrder.push("middleware");
      req.user = { id: 123, email: "me@example.com" };
      next();
    });

    authController.me.mockImplementation((req, res) => {
      callOrder.push("controller");
      return res.status(200).json({ ok: true, user: req.user });
    });

    const app = makeApp();

    const res = await request(app).get("/auth/me");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      user: { id: 123, email: "me@example.com" },
    });

    expect(authMiddleware).toHaveBeenCalledTimes(1);
    expect(authController.me).toHaveBeenCalledTimes(1);

    expect(callOrder).toEqual(["middleware", "controller"]);
  });
});
