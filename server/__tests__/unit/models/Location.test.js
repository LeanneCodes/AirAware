const Location = require("../../../models/Location");
const db = require("../../../db/connect");

jest.mock("../../../db/connect", () => ({
  query: jest.fn(),
}));

describe("Location model (unit)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENWEATHER_API_KEY = "test-key";

    global.fetch = jest.fn(async (url) => {
      // City direct geocode
      if (url.includes("/geo/1.0/direct")) {
        return {
          ok: true,
          json: async () => [{ name: "London", country: "GB", lat: 51.5073, lon: -0.1276 }],
        };
      }

      // Postcode geocode
      if (url.includes("/geo/1.0/zip")) {
        return {
          ok: true,
          json: async () => ({ name: "LS1 1AD", country: "GB", lat: 53.7961, lon: -1.5536 }),
        };
      }

      // Reverse geocode
      if (url.includes("/geo/1.0/reverse")) {
        return {
          ok: true,
          json: async () => [{ name: "Leeds", country: "GB" }],
        };
      }

      // Default failure
      return { ok: false, json: async () => ({}) };
    });
  });

  describe("resolveLocation", () => {
    test("resolves a city to label + coordinates", async () => {
      const result = await Location.resolveLocation({ city: "  London  " });

      expect(result).toEqual({
        label: "London, GB",
        latitude: 51.5073,
        longitude: -0.1276,
      });
    });

    test("resolves a postcode and uses reverse geocoding for city label", async () => {
      const result = await Location.resolveLocation({ postcode: " ls1 1ad " });

      expect(result.label).toBe("Leeds, GB");
      expect(result.latitude).toBe(53.7961);
      expect(result.longitude).toBe(-1.5536);
    });

    test("throws if both city and postcode provided", async () => {
      await expect(Location.resolveLocation({ city: "London", postcode: "LS1 1AD" })).rejects.toThrow(
        "Provide either a city or a postcode"
      );
    });

    test("throws if neither city nor postcode provided", async () => {
      await expect(Location.resolveLocation({})).rejects.toThrow("Provide either a city or a postcode");
    });

    test("throws if OpenWeather direct geocode returns empty array", async () => {
      global.fetch = jest.fn(async (url) => {
        if (url.includes("/geo/1.0/direct")) {
          return { ok: true, json: async () => [] };
        }
        return { ok: false, json: async () => ({}) };
      });

      await expect(Location.resolveLocation({ city: "Nowhere" })).rejects.toThrow();
    });

    test("throws if OpenWeather request is not ok", async () => {
      global.fetch = jest.fn(async () => ({ ok: false, json: async () => ({}) }));
      await expect(Location.resolveLocation({ city: "London" })).rejects.toThrow();
    });
  });

  describe("newLocation", () => {
    test("inserts a new home location and returns a Location instance", async () => {
      db.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: "loc-1",
              user_id: "user-1",
              label: "London, GB",
              latitude: "51.5073",
              longitude: "-0.1276",
              is_home: true,
              created_at: new Date().toISOString(),
            },
          ],
        });

      const loc = await Location.newLocation({ userId: "user-1", city: "London" });

      expect(db.query).toHaveBeenCalled();
      expect(loc).toBeInstanceOf(Location);
      expect(loc.label).toBe("London, GB");
      expect(loc.isHome).toBe(true);
    });
  });

  describe("getLocationByUserId", () => {
    test("returns null if no location exists", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const loc = await Location.getLocationByUserId("user-1");
      expect(loc).toBeNull();
    });

    test("returns a Location instance if found", async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: "loc-1",
            user_id: "user-1",
            label: "London, GB",
            latitude: "51.5073",
            longitude: "-0.1276",
            is_home: true,
            created_at: new Date().toISOString(),
          },
        ],
      });

      const loc = await Location.getLocationByUserId("user-1");
      expect(loc).toBeInstanceOf(Location);
      expect(loc.label).toBe("London, GB");
      expect(loc.isHome).toBe(true);
    });
  });

  describe("updateLocationByUserId", () => {
    test("returns null if no active location exists", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const updated = await Location.updateLocationByUserId({ userId: "user-1", city: "London" });
      expect(updated).toBeNull();
    });

    test("updates active location and returns Location instance", async () => {
      db.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: "loc-1",
              user_id: "user-1",
              label: "Old, GB",
              latitude: "0",
              longitude: "0",
              is_home: true,
              created_at: new Date().toISOString(),
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: "loc-1",
              user_id: "user-1",
              label: "London, GB",
              latitude: "51.5073",
              longitude: "-0.1276",
              is_home: true,
              created_at: new Date().toISOString(),
            },
          ],
        });

      const updated = await Location.updateLocationByUserId({ userId: "user-1", city: "London" });

      expect(updated).toBeInstanceOf(Location);
      expect(updated.label).toBe("London, GB");
    });
  });

  describe("setHomeById", () => {
    test("returns null if location not found for user", async () => {
      db.query.mockImplementation(async (sql) => {
        const q = String(sql).toLowerCase();

        // ownership check SELECT returns none
        if (q.includes("select") && q.includes("from locations") && q.includes("where") && q.includes("id")) {
          return { rows: [] };
        }

        return { rows: [] };
      });

      const result = await Location.setHomeById({ userId: "user-1", locationId: "loc-x" });
      expect(result).toBeNull();
    });

    test("sets home location and returns Location instance", async () => {
      const row = {
        id: "loc-2",
        user_id: "user-1",
        label: "Leeds, GB",
        latitude: "53.7961",
        longitude: "-1.5536",
        is_home: true,
        created_at: new Date().toISOString(),
      };

      db.query.mockImplementation(async (sql) => {
        const q = String(sql).toLowerCase();

        // ownership check SELECT (verify location belongs to user)
        if (q.includes("select") && q.includes("from locations") && q.includes("where") && q.includes("id")) {
          return { rows: [row] };
        }

        // unset old home(s)
        if (q.includes("update") && q.includes("locations") && q.includes("set") && q.includes("is_home") && q.includes("false")) {
          return { rows: [] };
        }

        // set selected home (RETURNING *)
        if (q.includes("update") && q.includes("locations") && q.includes("set") && q.includes("is_home") && q.includes("true")) {
          return { rows: [row] };
        }

        // any final select/return
        if (q.includes("select") && q.includes("from locations") && q.includes("where") && q.includes("user_id")) {
          return { rows: [row] };
        }

        return { rows: [] };
      });

      const result = await Location.setHomeById({ userId: "user-1", locationId: "loc-2" });

      expect(result).toBeInstanceOf(Location);
      expect(result.id).toBe("loc-2");
      expect(result.isHome).toBe(true);
    });
  });

  describe("getUniqueByUserId", () => {
    test("returns array of Location instances", async () => {
      db.query.mockImplementation(async (sql) => {
        const q = String(sql).toLowerCase();

        // Match broadly: DISTINCT ON / GROUP BY / normal SELECT are all ok
        if (q.includes("from locations") && q.includes("where") && q.includes("user_id")) {
          return {
            rows: [
              {
                id: "loc-1",
                user_id: "user-1",
                label: "London, GB",
                latitude: "51.5073",
                longitude: "-0.1276",
                is_home: true,
                created_at: new Date().toISOString(),
              },
              {
                id: "loc-2",
                user_id: "user-1",
                label: "Leeds, GB",
                latitude: "53.7961",
                longitude: "-1.5536",
                is_home: false,
                created_at: new Date().toISOString(),
              },
            ],
          };
        }

        return { rows: [] };
      });

      const list = await Location.getUniqueByUserId("user-1");

      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
      expect(list[0]).toBeInstanceOf(Location);
    });
  });

  describe("deleteClusterById", () => {
    test("returns null if target not found", async () => {
      db.query.mockImplementation(async (sql) => {
        const q = String(sql).toLowerCase();

        if (q.includes("select") && q.includes("from locations") && q.includes("id")) {
          return { rows: [] };
        }

        return { rows: [] };
      });

      const result = await Location.deleteClusterById({ userId: "user-1", locationId: "loc-x" });
      expect(result).toBeNull();
    });

    test("deletes cluster and reports deletedHome=false", async () => {
      const target = {
        id: "loc-1",
        user_id: "user-1",
        latitude: "51.5073",
        longitude: "-0.1276",
        is_home: false,
      };

      db.query.mockImplementation(async (sql) => {
        const q = String(sql).toLowerCase();

        if (q.includes("select") && q.includes("from locations") && q.includes("id") && q.includes("user_id")) {
          return { rows: [target] };
        }

        if (q.includes("delete") && q.includes("from locations")) {
          return { rows: [{ id: "a" }, { id: "b" }], rowCount: 2 };
        }

        return { rows: [] };
      });

      const result = await Location.deleteClusterById({ userId: "user-1", locationId: "loc-1" });
      expect(result).toEqual({ deletedCount: 2, deletedHome: false });
    });

    test("deletes cluster and reports deletedHome=true", async () => {
      const targetHome = {
        id: "loc-1",
        user_id: "user-1",
        latitude: "51.5073",
        longitude: "-0.1276",
        is_home: true,
      };

      db.query.mockImplementation(async (sql) => {
        const q = String(sql).toLowerCase();

        // Broader select matcher (less brittle with CTEs)
        if (q.includes("select") && q.includes("from locations") && q.includes("id") && q.includes("user_id")) {
          return { rows: [targetHome] };
        }

        // IMPORTANT: provide home info in DELETE result too, in case the model computes deletedHome from deleted rows
        if (q.includes("delete") && q.includes("from locations")) {
          return { rows: [{ id: "a", is_home: true }], rowCount: 1 };
        }

        return { rows: [] };
      });

      const result = await Location.deleteClusterById({ userId: "user-1", locationId: "loc-1" });
      expect(result).toEqual({ deletedCount: 1, deletedHome: true });
    });
  });
});