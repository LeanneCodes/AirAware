const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("validator", () => ({ isEmail: jest.fn() }));

jest.mock("../../../models/Auth.js", () => ({
  createUser: jest.fn(),
  getUserByEmail: jest.fn(),
}));

const Auth = require("../../../models/Auth.js");
const authController = require("../../../controllers/authController.js");

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe("authController unit tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "testsecret";
    process.env.JWT_EXPIRES_IN = "7d";
  });

  describe("register", () => {
    test("201 - registers a user and returns token + user", async () => {
      const req = {
        body: { email: "test@airaware.com", password: "Password123!" },
      };
      const res = makeRes();

      validator.isEmail.mockReturnValue(true);
      Auth.getUserByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed_pw");

      Auth.createUser.mockResolvedValue({
        id: "11111111-1111-1111-1111-111111111111",
        email: "test@airaware.com",
      });

      jwt.sign.mockReturnValue("fake.jwt.token");

      await authController.register(req, res);

      expect(Auth.getUserByEmail).toHaveBeenCalledWith("test@airaware.com");
      expect(bcrypt.hash).toHaveBeenCalledWith("Password123!", 10);
      expect(Auth.createUser).toHaveBeenCalledWith({
        email: "test@airaware.com",
        passwordHash: "hashed_pw",
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        token: "fake.jwt.token",
        user: {
          id: "11111111-1111-1111-1111-111111111111",
          email: "test@airaware.com",
        },
      });
    });

    test("400 - missing required fields", async () => {
      const req = { body: { email: "", password: "" } };
      const res = makeRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "email and password are required",
      });

      expect(Auth.getUserByEmail).not.toHaveBeenCalled();
      expect(Auth.createUser).not.toHaveBeenCalled();
    });

    test("400 - invalid email", async () => {
      const req = { body: { email: "not-an-email", password: "Password123!" } };
      const res = makeRes();

      validator.isEmail.mockReturnValue(false);

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid email" });
    });

    test("400 - password too short", async () => {
      const req = { body: { email: "test@airaware.com", password: "12345" } };
      const res = makeRes();

      validator.isEmail.mockReturnValue(true);

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Password must be at least 6 characters",
      });
    });

    test("409 - email already registered", async () => {
      const req = { body: { email: "test@airaware.com", password: "Password123!" } };
      const res = makeRes();

      validator.isEmail.mockReturnValue(true);
      Auth.getUserByEmail.mockResolvedValue({ id: "x", email: "test@airaware.com" });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: "Email already registered" });
    });

    test("500 - server error", async () => {
      const req = { body: { email: "test@airaware.com", password: "Password123!" } };
      const res = makeRes();

      validator.isEmail.mockReturnValue(true);
      Auth.getUserByEmail.mockRejectedValue(new Error("DB down"));

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });

  describe("login", () => {
    test("200 - logs in successfully and returns token + user", async () => {
      const req = {
        body: { email: "test@airaware.com", password: "Password123!" },
      };
      const res = makeRes();

      Auth.getUserByEmail.mockResolvedValue({
        id: "22222222-2222-2222-2222-222222222222",
        email: "test@airaware.com",
        password_hash: "hashed_pw",
      });

      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("fake.jwt.token");

      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledWith({
        token: "fake.jwt.token",
        user: {
          id: "22222222-2222-2222-2222-222222222222",
          email: "test@airaware.com",
        },
      });
    });

    test("400 - missing required fields", async () => {
      const req = { body: { email: "", password: "" } };
      const res = makeRes();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "email and password are required",
      });
    });

    test("401 - invalid credentials (no user)", async () => {
      const req = { body: { email: "test@airaware.com", password: "Password123!" } };
      const res = makeRes();

      Auth.getUserByEmail.mockResolvedValue(null);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });

    test("401 - invalid credentials (wrong password)", async () => {
      const req = { body: { email: "test@airaware.com", password: "wrong" } };
      const res = makeRes();

      Auth.getUserByEmail.mockResolvedValue({
        id: "22222222-2222-2222-2222-222222222222",
        email: "test@airaware.com",
        password_hash: "hashed_pw",
      });

      bcrypt.compare.mockResolvedValue(false);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });
  });

  describe("me", () => {
    test("200 - returns current user from req.user", async () => {
      const req = { user: { id: "abc", email: "me@airaware.com" } };
      const res = makeRes();

      await authController.me(req, res);

      expect(res.json).toHaveBeenCalledWith({
        user: { id: "abc", email: "me@airaware.com" },
      });
    });
  });
});
