jest.mock("../../../db/connect", () => ({
  query: jest.fn(),
}));

const db = require("../../../db/connect");
const Auth = require("../../../models/Auth.js"); // note .js

describe("Auth model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    it("inserts a user and returns the created row", async () => {
      const mockRow = {
        id: "11111111-1111-1111-1111-111111111111",
        email: "test@example.com",
        created_at: "2026-01-26T00:00:00.000Z",
      };

      db.query.mockResolvedValueOnce({ rows: [mockRow] });

      const input = {
        email: "test@example.com",
        passwordHash: "hashed_pw",
      };

      const result = await Auth.createUser(input);

      expect(db.query).toHaveBeenCalledTimes(1);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toEqual(expect.stringContaining("INSERT INTO users"));
      expect(sql).toEqual(expect.stringContaining("email"));
      expect(sql).toEqual(expect.stringContaining("password_hash"));
      expect(sql).toEqual(expect.stringContaining("VALUES ($1, $2)"));
      expect(sql).toEqual(expect.stringContaining("RETURNING"));

      expect(params).toEqual([input.email, input.passwordHash]);
      expect(result).toEqual(mockRow);
    });
  });

  describe("getUserByEmail", () => {
    it("returns a user row when found", async () => {
      const mockRow = {
        id: "22222222-2222-2222-2222-222222222222",
        email: "found@example.com",
        password_hash: "hash",
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
        id: "33333333-3333-3333-3333-333333333333",
        email: "idfound@example.com",
      };

      db.query.mockResolvedValueOnce({ rows: [mockRow] });

      const result = await Auth.getUserById("33333333-3333-3333-3333-333333333333");

      expect(db.query).toHaveBeenCalledTimes(1);

      const [sql, params] = db.query.mock.calls[0];
      expect(sql).toEqual(expect.stringContaining("SELECT id, email"));
      expect(sql).toEqual(expect.stringContaining("FROM users"));
      expect(sql).toEqual(expect.stringContaining("WHERE id = $1"));
      expect(params).toEqual(["33333333-3333-3333-3333-333333333333"]);

      expect(result).toEqual(mockRow);
    });

    it("returns null when no user is found", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await Auth.getUserById("99999999-9999-9999-9999-999999999999");

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });
});
