const request = require("supertest");
const express = require("express");

// Mock middleware + controller
jest.mock("../../../middleware/authMiddleware", () => jest.fn());
jest.mock("../../../controllers/userController", () => ({
  getMe: jest.fn(),
  updateMe: jest.fn(),
  deleteMe: jest.fn(), // ✅ add this so router.delete handler is a function
}));

const authMiddleware = require("../../../middleware/authMiddleware");
const userController = require("../../../controllers/userController");
const userRoutes = require("../../../routers/userRoutes");

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/user", userRoutes);
  return app;
}

describe("User Routes integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /user/me", () => {
    test("passes through authMiddleware and calls getMe", async () => {
      const app = makeApp();

      authMiddleware.mockImplementation((req, res, next) => next());
      userController.getMe.mockImplementation((req, res) =>
        res.status(200).json({ route: "getMe" })
      );

      const res = await request(app)
        .get("/user/me")
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ route: "getMe" });

      expect(authMiddleware).toHaveBeenCalledTimes(1);
      expect(userController.getMe).toHaveBeenCalledTimes(1);
    });

    test("authMiddleware blocks request and controller is not called", async () => {
      const app = makeApp();

      authMiddleware.mockImplementation((req, res) =>
        res.status(401).json({ error: "Invalid token" })
      );

      const res = await request(app).get("/user/me");

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Invalid token" });

      expect(authMiddleware).toHaveBeenCalledTimes(1);
      expect(userController.getMe).not.toHaveBeenCalled();
    });
  });

  describe("PATCH /user/me", () => {
    test("passes through authMiddleware and calls updateMe", async () => {
      const app = makeApp();

      authMiddleware.mockImplementation((req, res, next) => next());
      userController.updateMe.mockImplementation((req, res) =>
        res.status(200).json({ route: "updateMe" })
      );

      const res = await request(app)
        .patch("/user/me")
        .set("Authorization", "Bearer token")
        // ✅ use an allowed field from your controller/model
        .send({ first_name: "Sana" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ route: "updateMe" });

      expect(authMiddleware).toHaveBeenCalledTimes(1);
      expect(userController.updateMe).toHaveBeenCalledTimes(1);
    });

    test("authMiddleware blocks PATCH and controller is not called", async () => {
      const app = makeApp();

      authMiddleware.mockImplementation((req, res) =>
        res.status(401).json({ error: "Missing token" })
      );

      const res = await request(app)
        .patch("/user/me")
        .send({ first_name: "Sana" });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Missing token" });

      expect(authMiddleware).toHaveBeenCalledTimes(1);
      expect(userController.updateMe).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /user/me", () => {
    test("passes through authMiddleware and calls deleteMe", async () => {
      const app = makeApp();

      authMiddleware.mockImplementation((req, res, next) => next());
      userController.deleteMe.mockImplementation((req, res) =>
        res.status(204).send()
      );

      const res = await request(app)
        .delete("/user/me")
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(204);

      expect(authMiddleware).toHaveBeenCalledTimes(1);
      expect(userController.deleteMe).toHaveBeenCalledTimes(1);
    });

    test("authMiddleware blocks DELETE and controller is not called", async () => {
      const app = makeApp();

      authMiddleware.mockImplementation((req, res) =>
        res.status(401).json({ error: "Missing token" })
      );

      const res = await request(app).delete("/user/me");

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Missing token" });

      expect(authMiddleware).toHaveBeenCalledTimes(1);
      expect(userController.deleteMe).not.toHaveBeenCalled();
    });
  });
});
