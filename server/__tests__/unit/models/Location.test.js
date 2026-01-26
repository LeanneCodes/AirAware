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
      await expect(Location.resolveLocation({ city: "London", postcode: "LS1 1AD" }))
        .rejects.toThrow("Provide either a city or a postcode");
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
      // The exact call sequence can vary; this matches common flow:
      // 1) unset old home(s)  2) insert new row returning *
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
      db.query.mockResolvedValueOnce({ rows: [] }); // getActiveLocationRow

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
        }) // getActiveLocationRow
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
    test("returns null if nothing updated (location not found for user)", async () => {
      db.query
        .mockResolvedValueOnce({ rows: [] }) 
        .mockResolvedValueOnce({ rows: [] });

      const result = await Location.setHomeById({ userId: "user-1", locationId: "loc-x" });
      expect(result).toBeNull();
    });

    test("sets home location and returns Location instance", async () => {
      db.query
        .mockResolvedValueOnce({ rows: [] }) 
        .mockResolvedValueOnce({
          rows: [
            {
              id: "loc-2",
              user_id: "user-1",
              label: "Leeds, GB",
              latitude: "53.7961",
              longitude: "-1.5536",
              is_home: true,
              created_at: new Date().toISOString(),
            },
          ],
        });

      const result = await Location.setHomeById({ userId: "user-1", locationId: "loc-2" });

      expect(result).toBeInstanceOf(Location);
      expect(result.id).toBe("loc-2");
      expect(result.isHome).toBe(true);
    });
  });

  describe("deleteClusterById", () => {
    test("returns null if no rows deleted (not found for user)", async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // SELECT target by id/user_id

      const result = await Location.deleteClusterById({ userId: "user-1", locationId: "loc-x" });
      expect(result).toBeNull();
    });

    test("deletes cluster and reports deletedHome=false", async () => {
      db.query
        .mockResolvedValueOnce({
          rows: [
            { id: "loc-1", user_id: "user-1", latitude: "51.5073", longitude: "-0.1276", is_home: false },
          ],
        }) // SELECT target
        .mockResolvedValueOnce({
          rowCount: 2,
          rows: [
            { id: "loc-1" },
            { id: "loc-9" },
          ],
        }); // DELETE cluster

      const result = await Location.deleteClusterById({ userId: "user-1", locationId: "loc-1" });

      expect(result).toEqual({ deletedCount: 2, deletedHome: false });
    });

    test("deletes cluster and reports deletedHome=true", async () => {
      db.query
        .mockResolvedValueOnce({
          rows: [
            { id: "loc-1", user_id: "user-1", latitude: "51.5073", longitude: "-0.1276", is_home: true },
          ],
        }) // SELECT target
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ id: "loc-1" }],
        }); // DELETE cluster

      const result = await Location.deleteClusterById({ userId: "user-1", locationId: "loc-1" });

      expect(result).toEqual({ deletedCount: 1, deletedHome: true });
    });
  });

  describe("getUniqueByUserId", () => {
    test("returns array of Location instances", async () => {
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
      });

      const list = await Location.getUniqueByUserId("user-1");
      expect(Array.isArray(list)).toBe(true);
      expect(list).toHaveLength(2);
      expect(list[0]).toBeInstanceOf(Location);
      expect(list[1]).toBeInstanceOf(Location);
    });
  });
});
