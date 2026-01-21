jest.mock("../../../models/User", () => ({
  getById: jest.fn(),
  updateById: jest.fn(),
}));

const User = require("../../../models/User");
const userController = require("../../../controllers/userController");

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("userController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMe", () => {
    test("returns 401 if not authenticated (no req.user.id)", async () => {
      const req = { user: undefined };
      const res = makeRes();

      await userController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Not authenticated" });
      expect(User.getById).not.toHaveBeenCalled();
    });

    test("returns 404 if user not found", async () => {
      const req = { user: { id: "user-1" } };
      const res = makeRes();

      User.getById.mockResolvedValue(null);

      await userController.getMe(req, res);

      expect(User.getById).toHaveBeenCalledWith("user-1");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    test("returns 200 and user if found", async () => {
      const req = { user: { id: "user-1" } };
      const res = makeRes();

      const fakeUser = {
        id: "user-1",
        email: "a@b.com",
        condition_type: "asthma",
        sensitivity_level: "high",
        accessibility_mode: false,
        analytics_opt_in: true,
      };

      User.getById.mockResolvedValue(fakeUser);

      await userController.getMe(req, res);

      expect(User.getById).toHaveBeenCalledWith("user-1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ user: fakeUser });
    });

    test("returns 500 on unexpected error", async () => {
      const req = { user: { id: "user-1" } };
      const res = makeRes();

      User.getById.mockRejectedValue(new Error("DB down"));

      await userController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Server error", details: "DB down" })
      );
    });
  });

  describe("updateMe", () => {
    test("returns 401 if not authenticated (no req.user.id)", async () => {
      const req = { user: undefined, body: {} };
      const res = makeRes();

      await userController.updateMe(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Not authenticated" });
      expect(User.updateById).not.toHaveBeenCalled();
    });

    test("returns 400 if no valid fields provided", async () => {
      const req = { user: { id: "user-1" }, body: { somethingElse: 123 } };
      const res = makeRes();

      await userController.updateMe(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "No valid fields provided to update" });
      expect(User.updateById).not.toHaveBeenCalled();
    });

    test("returns 400 for invalid condition_type", async () => {
      const req = { user: { id: "user-1" }, body: { condition_type: "bad" } };
      const res = makeRes();

      await userController.updateMe(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("condition_type must be one of") })
      );
      expect(User.updateById).not.toHaveBeenCalled();
    });

    test("returns 400 for invalid sensitivity_level", async () => {
      const req = { user: { id: "user-1" }, body: { sensitivity_level: "extreme" } };
      const res = makeRes();

      await userController.updateMe(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("sensitivity_level must be one of") })
      );
      expect(User.updateById).not.toHaveBeenCalled();
    });

    test("returns 400 if accessibility_mode is not boolean", async () => {
      const req = { user: { id: "user-1" }, body: { accessibility_mode: "yes" } };
      const res = makeRes();

      await userController.updateMe(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "accessibility_mode must be a boolean" });
      expect(User.updateById).not.toHaveBeenCalled();
    });

    test("returns 400 if analytics_opt_in is not boolean", async () => {
      const req = { user: { id: "user-1" }, body: { analytics_opt_in: "true" } };
      const res = makeRes();

      await userController.updateMe(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "analytics_opt_in must be a boolean" });
      expect(User.updateById).not.toHaveBeenCalled();
    });

    test("returns 400 if accepted_disclaimer_at is invalid datetime", async () => {
      const req = { user: { id: "user-1" }, body: { accepted_disclaimer_at: "not-a-date" } };
      const res = makeRes();

      await userController.updateMe(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "accepted_disclaimer_at must be a valid datetime or null",
      });
      expect(User.updateById).not.toHaveBeenCalled();
    });

    test("success: updates allowed fields and returns 200", async () => {
      const req = {
        user: { id: "user-1" },
        body: {
          condition_type: "ASTHMA", // should be normalized to lowercase
          sensitivity_level: "High", // normalized
          accessibility_mode: true,
          analytics_opt_in: false,
        },
      };
      const res = makeRes();

      const updatedUser = {
        id: "user-1",
        email: "a@b.com",
        condition_type: "asthma",
        sensitivity_level: "high",
        accessibility_mode: true,
        analytics_opt_in: false,
      };

      User.updateById.mockResolvedValue(updatedUser);

      await userController.updateMe(req, res);

      expect(User.updateById).toHaveBeenCalledWith("user-1", {
        condition_type: "asthma",
        sensitivity_level: "high",
        accessibility_mode: true,
        analytics_opt_in: false,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Profile updated",
        user: updatedUser,
      });
    });

    test("success: accepted_disclaimer_at can be set to null", async () => {
      const req = {
        user: { id: "user-1" },
        body: { accepted_disclaimer_at: null },
      };
      const res = makeRes();

      User.updateById.mockResolvedValue({ id: "user-1", accepted_disclaimer_at: null });

      await userController.updateMe(req, res);

      expect(User.updateById).toHaveBeenCalledWith("user-1", { accepted_disclaimer_at: null });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Profile updated" })
      );
    });

    test("success: accepted_disclaimer_at converts to ISO string", async () => {
      const req = {
        user: { id: "user-1" },
        body: { accepted_disclaimer_at: "2026-01-01T12:00:00Z" },
      };
      const res = makeRes();

      User.updateById.mockResolvedValue({ id: "user-1" });

      await userController.updateMe(req, res);

      const callArgs = User.updateById.mock.calls[0][1];
      expect(callArgs).toHaveProperty("accepted_disclaimer_at");
      // should be ISO-ish
      expect(typeof callArgs.accepted_disclaimer_at).toBe("string");
      expect(callArgs.accepted_disclaimer_at).toContain("T");
      expect(callArgs.accepted_disclaimer_at).toContain("Z");
    });

    test("returns 404 if updateById returns null (user not found)", async () => {
      const req = {
        user: { id: "user-1" },
        body: { condition_type: "asthma" },
      };
      const res = makeRes();

      User.updateById.mockResolvedValue(null);

      await userController.updateMe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    test("returns 500 on unexpected error", async () => {
      const req = {
        user: { id: "user-1" },
        body: { condition_type: "asthma" },
      };
      const res = makeRes();

      User.updateById.mockRejectedValue(new Error("DB error"));

      await userController.updateMe(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Server error", details: "DB error" })
      );
    });
  });
});
