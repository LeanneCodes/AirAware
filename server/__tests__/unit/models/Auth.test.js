jest.mock("../../../db/connect", () => ({
  query: jest.fn(),
}));

const db = require("../../../db/connect");
const Auth = require("../../../models/Auth");

describe("Auth model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    it("inserts a user and returns the created row", async () => {
      const mockRow = {
        id: 1,
        email: "test@example.com",
        condition_type: "asthma",
        sensitivity_level: "high",
        created_at: "2026-01-21T00:00:00.000Z",
      };

      db.query.mockResolvedValueOnce({ rows: [mockRow] });

      const input = {
        email: "test@example.com",
        passwordHash: "hashed_pw",
        conditionType: "asthma",
        sensitivityLevel: "high",
      };

      const result = await Auth.createUser(input);

      expect(db.query).toHaveBeenCalledTimes(1);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toEqual(expect.stringContaining("INSERT INTO users"));
      expect(sql).toEqual(expect.stringContaining("password_hash"));
      expect(sql).toEqual(expect.stringContaining("RETURNING"));
      expect(params).toEqual([
        input.email,
        input.passwordHash,
        input.conditionType,
        input.sensitivityLevel,
      ]);

      expect(result).toEqual(mockRow);
    });
  });

  describe("getUserByEmail", () => {
    it("returns a user row when found", async () => {
      const mockRow = {
        id: 2,
        email: "found@example.com",
        password_hash: "hash",
        condition_type: "eczema",
        sensitivity_level: "medium",
      };

      db.query.mockResolvedValueOnce({ rows: [mockRow] });

      const result = await Auth.getUserByEmail("found@example.com");

      expect(db.query).toHaveBeenCalledTimes(1);

      const [sql, params] = db.query.mock.calls[0];
      expect(sql).toEqual(expect.stringContaining("SELECT id, email, password_hash"));
      expect(sql).toEqual(expect.stringContaining("FROM users"));
      expect(sql).toEqual(expect.stringContaining("WHERE email = $1"));
      expect(params).toEqual(["found@example.com"]);

      expect(result).toEqual(mockRow);
    });

    it("returns null when no user is found", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await Auth.getUserByEmail("missing@example.com");

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });

  describe("getUserById", () => {
    it("returns a user row when found", async () => {
      const mockRow = {
        id: 3,
        email: "idfound@example.com",
        condition_type: "asthma",
        sensitivity_level: "low",
      };

      db.query.mockResolvedValueOnce({ rows: [mockRow] });

      const result = await Auth.getUserById(3);

      expect(db.query).toHaveBeenCalledTimes(1);

      const [sql, params] = db.query.mock.calls[0];
      expect(sql).toEqual(expect.stringContaining("SELECT id, email, condition_type"));
      expect(sql).toEqual(expect.stringContaining("FROM users"));
      expect(sql).toEqual(expect.stringContaining("WHERE id = $1"));
      expect(params).toEqual([3]);

      expect(result).toEqual(mockRow);
    });

    it("returns null when no user is found", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await Auth.getUserById(999);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });
});
