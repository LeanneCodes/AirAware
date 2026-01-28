jest.mock("../../../models/User", () => ({
  getById: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
}));

const User = require("../../../models/User");
const userController = require("../../../controllers/userController");

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  };
}

describe("userController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMe", () => {
    test("401 if not authenticated", async () => {
      const req = { user: null };
      const res = makeRes();

      await userController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Not authenticated" });
      expect(User.getById).not.toHaveBeenCalled();
    });

    test("404 if user not found", async () => {
      const req = { user: { id: "user-1" } };
      const res = makeRes();

      User.getById.mockResolvedValue(null);

      await userController.getMe(req, res);

      expect(User.getById).toHaveBeenCalledWith("user-1");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    test("200 returns user", async () => {
      const req = { user: { id: "user-1" } };
      const res = makeRes();

      const fakeUser = { id: "user-1", email: "a@b.com", first_name: "A" };
      User.getById.mockResolvedValue(fakeUser);

      await userController.getMe(req, res);

      expect(User.getById).toHaveBeenCalledWith("user-1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ user: fakeUser });
    });

    test("500 on unexpected error", async () => {
      const req = { user: { id: "user-1" } };
      const res = makeRes();

      User.getById.mockRejectedValue(new Error("DB error"));

      await userController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Server error",
        details: "DB error",
      });
    });
  });

  describe("updateMe", () => {
    test("401 if not authenticated", async () => {
      const req = { user: null, body: {} };
      const res = makeRes();

      await userController.updateMe(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Not authenticated" });
      expect(User.updateById).not.toHaveBeenCalled();
    });

    test("400 when no valid fields provided", async () => {
      const req = {
        user: { id: "user-1" },
        body: {
          // ignored fields
          email: "hack@b.com",
          condition_type: "asthma",
          analytics_opt_in: true,
        },
      };
      const res = makeRes();

      await userController.updateMe(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "No valid fields provided to update",
      });
      expect(User.updateById).not.toHaveBeenCalled();
    });

    test("200 updates allowed fields and returns updated user", async () => {
      const req = {
        user: { id: "user-1" },
        body: {
          first_name: "New",
          last_name: "Name",
          nationality: "GB",
          // ignored
          email: "hack@b.com",
        },
      };
      const res = makeRes();

      const updatedRow = {
        id: "user-1",
        email: "a@b.com",
        first_name: "New",
        last_name: "Name",
        nationality: "GB",
      };

      User.updateById.mockResolvedValue(updatedRow);

      await userController.updateMe(req, res);

      expect(User.updateById).toHaveBeenCalledWith("user-1", {
        first_name: "New",
        last_name: "Name",
        nationality: "GB",
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Profile updated",
        user: updatedRow,
      });
    });

    test("404 if updateById returns null (user not found)", async () => {
      const req = {
        user: { id: "user-1" },
        body: { first_name: "New" },
      };
      const res = makeRes();

      User.updateById.mockResolvedValue(null);

      await userController.updateMe(req, res);

      expect(User.updateById).toHaveBeenCalledWith("user-1", { first_name: "New" });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    test("500 on unexpected error", async () => {
      const req = {
        user: { id: "user-1" },
        body: { first_name: "New" },
      };
      const res = makeRes();

      User.updateById.mockRejectedValue(new Error("DB error"));

      await userController.updateMe(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Server error",
        details: "DB error",
      });
    });
  });

  describe("deleteMe", () => {
    test("401 if not authenticated", async () => {
      const req = { user: null };
      const res = makeRes();

      await userController.deleteMe(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Not authenticated" });
      expect(User.deleteById).not.toHaveBeenCalled();
    });

    test("404 if user not found", async () => {
      const req = { user: { id: "user-1" } };
      const res = makeRes();

      User.deleteById.mockResolvedValue(null);

      await userController.deleteMe(req, res);

      expect(User.deleteById).toHaveBeenCalledWith("user-1");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    test("204 on successful delete", async () => {
      const req = { user: { id: "user-1" } };
      const res = makeRes();

      User.deleteById.mockResolvedValue({ id: "user-1" });

      await userController.deleteMe(req, res);

      expect(User.deleteById).toHaveBeenCalledWith("user-1");
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalledWith();
    });

    test("500 on unexpected error", async () => {
      const req = { user: { id: "user-1" } };
      const res = makeRes();

      User.deleteById.mockRejectedValue(new Error("DB error"));

      await userController.deleteMe(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Server error",
        details: "DB error",
      });
    });
  });
});
