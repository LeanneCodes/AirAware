jest.mock("../../../db/connect", () => ({
  query: jest.fn(),
}));

const db = require("../../../db/connect");
const User = require("../../../models/User");

describe("User model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getById", () => {
    test("returns null when no user row found", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await User.getById("user-1");

      expect(db.query).toHaveBeenCalledTimes(1);
      const [sql, params] = db.query.mock.calls[0];
      expect(sql).toMatch(/FROM users/i);
      expect(sql).toMatch(/WHERE id = \$1/i);
      expect(params).toEqual(["user-1"]);

      expect(result).toBeNull();
    });

    test("returns the user row when found", async () => {
      const fakeUser = {
        id: "user-1",
        email: "a@b.com",
        condition_type: "asthma",
        sensitivity_level: "high",
        accessibility_mode: false,
        analytics_opt_in: true,
        accepted_disclaimer_at: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      };

      db.query.mockResolvedValue({ rows: [fakeUser] });

      const result = await User.getById("user-1");

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(fakeUser);
    });
  });

  describe("updateById", () => {
    test("when no allowed fields are provided, it returns getById(userId) and does not UPDATE", async () => {
      const fakeUser = { id: "user-1", email: "a@b.com" };

      // updateById should call getById which calls db.query once
      db.query.mockResolvedValueOnce({ rows: [fakeUser] });

      const result = await User.updateById("user-1", { email: "new@b.com", password_hash: "x" });

      expect(db.query).toHaveBeenCalledTimes(1);

      const [sql, params] = db.query.mock.calls[0];
      expect(sql).toMatch(/SELECT/i);
      expect(sql).toMatch(/FROM users/i);
      expect(params).toEqual(["user-1"]);

      expect(result).toEqual(fakeUser);
    });

    test("builds UPDATE query with only allowed fields and updates updated_at", async () => {
      const updatedRow = {
        id: "user-1",
        email: "a@b.com",
        condition_type: "both",
        sensitivity_level: "medium",
        accessibility_mode: true,
        analytics_opt_in: false,
        accepted_disclaimer_at: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-03T00:00:00.000Z",
      };

      db.query.mockResolvedValue({ rows: [updatedRow] });

      const result = await User.updateById("user-1", {
        condition_type: "both",
        analytics_opt_in: false,
        // not allowed — should be ignored
        email: "hack@b.com",
        password_hash: "hack",
      });

      expect(db.query).toHaveBeenCalledTimes(1);

      const [sql, params] = db.query.mock.calls[0];

      // It should be an UPDATE on users
      expect(sql).toMatch(/UPDATE users/i);

      // It should set allowed keys
      expect(sql).toMatch(/condition_type\s*=\s*\$1/i);
      expect(sql).toMatch(/analytics_opt_in\s*=\s*\$2/i);

      // It should always set updated_at = NOW()
      expect(sql).toMatch(/updated_at\s*=\s*NOW\(\)/i);

      // It should update WHERE id = $3 (since 2 fields + id)
      expect(sql).toMatch(/WHERE id\s*=\s*\$3/i);

      // Params should only include allowed values + userId
      expect(params).toEqual(["both", false, "user-1"]);

      // Returns returned row
      expect(result).toEqual(updatedRow);
    });

    test("returns null when UPDATE returns no rows", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await User.updateById("user-1", { analytics_opt_in: true });

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    test("supports updating multiple allowed fields (parameter numbering correct)", async () => {
      db.query.mockResolvedValue({
        rows: [{ id: "user-1", condition_type: "asthma", sensitivity_level: "low" }],
      });

      await User.updateById("user-1", {
        condition_type: "asthma",
        sensitivity_level: "low",
        accessibility_mode: true,
      });

      const [sql, params] = db.query.mock.calls[0];

      // 3 fields => id should be $4
      expect(sql).toMatch(/WHERE id\s*=\s*\$4/i);
      expect(params).toEqual(["asthma", "low", true, "user-1"]);
    });
  });
});
