const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

jest.mock("../../../models/Auth", () => ({
  createUser: jest.fn(),
  getUserByEmail: jest.fn(),
}));


const Auth = require("../../../models/Auth");
const authController = require("../../../controllers/authController");

function makeRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe("authController unit tests", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test_secret";
    process.env.JWT_EXPIRES_IN = "1h";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe("register", () => {
    test("201 - registers a user and returns token + user", async () => {
      Auth.getUserByEmail.mockResolvedValue(null);
      Auth.createUser.mockResolvedValue({
        id: "11111111-1111-1111-1111-111111111111",
        email: "test@airaware.com",
        condition_type: "asthma",
        sensitivity_level: "medium",
      });

      jest.spyOn(jwt, "sign").mockReturnValue("fake.jwt.token");

      const req = {
        body: {
          email: "test@airaware.com",
          password: "password123",
          condition_type: "asthma",
          sensitivity_level: "medium",
        },
      };
      const res = makeRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        token: "fake.jwt.token",
        user: {
          id: "11111111-1111-1111-1111-111111111111",
          email: "test@airaware.com",
          condition_type: "asthma",
          sensitivity_level: "medium",
        },
      });

      expect(Auth.getUserByEmail).toHaveBeenCalledWith("test@airaware.com");
      expect(Auth.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@airaware.com",
          conditionType: "asthma",
          sensitivityLevel: "medium",
        })
      );
    });

    test("400 - missing required fields", async () => {
      const req = { body: { email: "test@airaware.com" } };
      const res = makeRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "email, password, condition_type, sensitivity_level are required",
      });
      expect(Auth.getUserByEmail).not.toHaveBeenCalled();
      expect(Auth.createUser).not.toHaveBeenCalled();
    });

    test("400 - invalid email", async () => {
      const req = {
        body: {
          email: "not-an-email",
          password: "password123",
          condition_type: "asthma",
          sensitivity_level: "medium",
        },
      };
      const res = makeRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid email" });
      expect(Auth.getUserByEmail).not.toHaveBeenCalled();
    });

    test("400 - password too short", async () => {
      const req = {
        body: {
          email: "test@airaware.com",
          password: "123",
          condition_type: "asthma",
          sensitivity_level: "medium",
        },
      };
      const res = makeRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Password must be at least 6 characters",
      });
      expect(Auth.getUserByEmail).not.toHaveBeenCalled();
    });

    test("400 - invalid condition_type", async () => {
      const req = {
        body: {
          email: "test@airaware.com",
          password: "password123",
          condition_type: "invalid",
          sensitivity_level: "medium",
        },
      };
      const res = makeRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "condition_type must be asthma, allergies, or both",
      });
      expect(Auth.getUserByEmail).not.toHaveBeenCalled();
    });

    test("400 - invalid sensitivity_level", async () => {
      const req = {
        body: {
          email: "test@airaware.com",
          password: "password123",
          condition_type: "asthma",
          sensitivity_level: "invalid",
        },
      };
      const res = makeRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "sensitivity_level must be low, medium, or high",
      });
      expect(Auth.getUserByEmail).not.toHaveBeenCalled();
    });

    test("409 - email already registered", async () => {
      Auth.getUserByEmail.mockResolvedValue({
        id: "existing-user-id",
        email: "test@airaware.com",
      });

      const req = {
        body: {
          email: "test@airaware.com",
          password: "password123",
          condition_type: "asthma",
          sensitivity_level: "medium",
        },
      };
      const res = makeRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: "Email already registered" });
      expect(Auth.createUser).not.toHaveBeenCalled();
    });

    test("500 - handles unexpected errors", async () => {
      Auth.getUserByEmail.mockRejectedValue(new Error("DB down"));

      const req = {
        body: {
          email: "test@airaware.com",
          password: "password123",
          condition_type: "asthma",
          sensitivity_level: "medium",
        },
      };
      const res = makeRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });

  describe("login", () => {
    test("200 - logs in successfully and returns token + user", async () => {
      const hash = await bcrypt.hash("password123", 10);

      Auth.getUserByEmail.mockResolvedValue({
        id: "22222222-2222-2222-2222-222222222222",
        email: "test@airaware.com",
        password_hash: hash,
        condition_type: "allergies",
        sensitivity_level: "low",
      });

      jest.spyOn(jwt, "sign").mockReturnValue("fake.jwt.token");

      const req = { body: { email: "test@airaware.com", password: "password123" } };
      const res = makeRes();

      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledWith({
        token: "fake.jwt.token",
        user: {
          id: "22222222-2222-2222-2222-222222222222",
          email: "test@airaware.com",
          condition_type: "allergies",
          sensitivity_level: "low",
        },
      });
    });

    test("400 - missing email or password", async () => {
      const req = { body: { email: "test@airaware.com" } };
      const res = makeRes();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "email and password are required" });
      expect(Auth.getUserByEmail).not.toHaveBeenCalled();
    });

    test("401 - invalid credentials (user not found)", async () => {
      Auth.getUserByEmail.mockResolvedValue(null);

      const req = { body: { email: "missing@airaware.com", password: "password123" } };
      const res = makeRes();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });

    test("401 - invalid credentials (wrong password)", async () => {
      const wrongHash = await bcrypt.hash("wrongpassword", 10);

      Auth.getUserByEmail.mockResolvedValue({
        id: "33333333-3333-3333-3333-333333333333",
        email: "test@airaware.com",
        password_hash: wrongHash,
        condition_type: "asthma",
        sensitivity_level: "medium",
      });

      const req = { body: { email: "test@airaware.com", password: "password123" } };
      const res = makeRes();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });

    test("500 - handles unexpected errors", async () => {
      Auth.getUserByEmail.mockRejectedValue(new Error("DB down"));

      const req = { body: { email: "test@airaware.com", password: "password123" } };
      const res = makeRes();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });

  describe("me", () => {
    test("200 - returns req.user", async () => {
      const req = { user: { id: "abc", email: "me@airaware.com" } };
      const res = makeRes();

      await authController.me(req, res);

      expect(res.json).toHaveBeenCalledWith({ user: { id: "abc", email: "me@airaware.com" } });
    });
  });
});