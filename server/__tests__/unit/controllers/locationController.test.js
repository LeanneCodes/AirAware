const locationController = require("../../../controllers/locationController");
const Location = require("../../../models/Location");

jest.mock("../../../models/Location");

function makeRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe("locationController (unit)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("setLocation", () => {
    test("401 if no user", async () => {
      const req = { user: null, body: { city: "London" } };
      const res = makeRes();

      await locationController.setLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorised" });
    });

    test("400 if neither city nor postcode provided", async () => {
      const req = { user: { id: "user-1" }, body: {} };
      const res = makeRes();

      await locationController.setLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Provide either a city or a postcode" });
      expect(Location.newLocation).not.toHaveBeenCalled();
    });

    test("400 if both city and postcode provided", async () => {
      const req = { user: { id: "user-1" }, body: { city: "London", postcode: "LS1 1AD" } };
      const res = makeRes();

      await locationController.setLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Provide either a city or a postcode" });
      expect(Location.newLocation).not.toHaveBeenCalled();
    });

    test("201 on success", async () => {
      Location.newLocation.mockResolvedValue({ label: "London, GB" });

      const req = { user: { id: "user-1" }, body: { city: "London" } };
      const res = makeRes();

      await locationController.setLocation(req, res);

      expect(Location.newLocation).toHaveBeenCalledWith({
        userId: "user-1",
        city: "London",
        postcode: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ location: { label: "London, GB" } });
    });

    test("400 when model throws", async () => {
      Location.newLocation.mockRejectedValue(new Error("DB error"));

      const req = { user: { id: "user-1" }, body: { city: "London" } };
      const res = makeRes();

      await locationController.setLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
    });
  });

  describe("getLocation", () => {
    test("401 if no user", async () => {
      const req = { user: null };
      const res = makeRes();

      await locationController.getLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorised" });
    });

    test("404 if none saved", async () => {
      Location.getLocationByUserId.mockResolvedValue(null);

      const req = { user: { id: "user-1" } };
      const res = makeRes();

      await locationController.getLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "No saved location found" });
    });

    test("200 if location exists", async () => {
      Location.getLocationByUserId.mockResolvedValue({ label: "London, GB" });

      const req = { user: { id: "user-1" } };
      const res = makeRes();

      await locationController.getLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ location: { label: "London, GB" } });
    });

    test("500 when model throws", async () => {
      Location.getLocationByUserId.mockRejectedValue(new Error("DB down"));

      const req = { user: { id: "user-1" } };
      const res = makeRes();

      await locationController.getLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "DB down" });
    });
  });

  describe("updateLocation", () => {
    test("401 if no user", async () => {
      const req = { user: null, body: { city: "London" } };
      const res = makeRes();

      await locationController.updateLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorised" });
    });

    test("400 if neither city nor postcode provided", async () => {
      const req = { user: { id: "user-1" }, body: {} };
      const res = makeRes();

      await locationController.updateLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Provide either a city or a postcode" });
    });

    test("404 if no saved location found", async () => {
      Location.updateLocationByUserId.mockResolvedValue(null);

      const req = { user: { id: "user-1" }, body: { city: "Leeds" } };
      const res = makeRes();

      await locationController.updateLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "No saved location found. Use POST /location first.",
      });
    });

    test("200 on success", async () => {
      Location.updateLocationByUserId.mockResolvedValue({ label: "Leeds, GB" });

      const req = { user: { id: "user-1" }, body: { city: "Leeds" } };
      const res = makeRes();

      await locationController.updateLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ location: { label: "Leeds, GB" } });
    });

    test("400 when model throws", async () => {
      Location.updateLocationByUserId.mockRejectedValue(new Error("Bad update"));

      const req = { user: { id: "user-1" }, body: { city: "Leeds" } };
      const res = makeRes();

      await locationController.updateLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Bad update" });
    });
  });

  describe("validateLocation", () => {
    test("400 if neither city nor postcode provided", async () => {
      const req = { query: {} };
      const res = makeRes();

      await locationController.validateLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Provide either a city or a postcode" });
      expect(Location.resolveLocation).not.toHaveBeenCalled();
    });

    test("400 if both city and postcode provided", async () => {
      const req = { query: { city: "London", postcode: "SW1A 1AA" } };
      const res = makeRes();

      await locationController.validateLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Provide either a city or a postcode" });
      expect(Location.resolveLocation).not.toHaveBeenCalled();
    });

    test("200 with result", async () => {
      Location.resolveLocation.mockResolvedValue({ label: "London, GB", latitude: 1, longitude: 2 });

      const req = { query: { city: "London" } };
      const res = makeRes();

      await locationController.validateLocation(req, res);

      expect(Location.resolveLocation).toHaveBeenCalledWith({ city: "London", postcode: undefined });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        result: { label: "London, GB", latitude: 1, longitude: 2 },
      });
    });

    test("400 when model throws", async () => {
      Location.resolveLocation.mockRejectedValue(new Error("Bad location"));

      const req = { query: { city: "London" } };
      const res = makeRes();

      await locationController.validateLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Bad location" });
    });
  });

  describe("getLocationHistory", () => {
    test("401 if no user", async () => {
      const req = { user: null };
      const res = makeRes();

      await locationController.getLocationHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorised" });
    });

    test("200 with locations", async () => {
      Location.getUniqueByUserId.mockResolvedValue([{ label: "London, GB" }]);

      const req = { user: { id: "user-1" } };
      const res = makeRes();

      await locationController.getLocationHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ locations: [{ label: "London, GB" }] });
    });

    test("500 when model throws", async () => {
      Location.getUniqueByUserId.mockRejectedValue(new Error("History fail"));

      const req = { user: { id: "user-1" } };
      const res = makeRes();

      await locationController.getLocationHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "History fail" });
    });
  });

  describe("selectLocation", () => {
    test("401 if no user", async () => {
      const req = { user: null, body: { locationId: "loc-1" } };
      const res = makeRes();

      await locationController.selectLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorised" });
    });

    test("400 if no locationId", async () => {
      const req = { user: { id: "user-1" }, body: {} };
      const res = makeRes();

      await locationController.selectLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "locationId is required" });
    });

    test("404 if location not found for user", async () => {
      Location.setHomeById.mockResolvedValue(null);

      const req = { user: { id: "user-1" }, body: { locationId: "loc-1" } };
      const res = makeRes();

      await locationController.selectLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Location not found for this user" });
    });

    test("200 on success", async () => {
      Location.setHomeById.mockResolvedValue({ id: "loc-1", label: "London, GB" });

      const req = { user: { id: "user-1" }, body: { locationId: "loc-1" } };
      const res = makeRes();

      await locationController.selectLocation(req, res);

      expect(Location.setHomeById).toHaveBeenCalledWith({ userId: "user-1", locationId: "loc-1" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ location: { id: "loc-1", label: "London, GB" } });
    });

    test("400 when model throws", async () => {
      Location.setHomeById.mockRejectedValue(new Error("Select fail"));

      const req = { user: { id: "user-1" }, body: { locationId: "loc-1" } };
      const res = makeRes();

      await locationController.selectLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Select fail" });
    });
  });

  describe("deleteLocation", () => {
    test("401 if no user", async () => {
      const req = { user: null, params: { id: "loc-1" } };
      const res = makeRes();

      await locationController.deleteLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorised" });
    });

    test("400 if no location id param", async () => {
      const req = { user: { id: "user-1" }, params: {} };
      const res = makeRes();

      await locationController.deleteLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Location id is required" });
    });

    test("404 if location not found for this user", async () => {
      Location.deleteClusterById.mockResolvedValue(null);

      const req = { user: { id: "user-1" }, params: { id: "loc-1" } };
      const res = makeRes();

      await locationController.deleteLocation(req, res);

      expect(Location.deleteClusterById).toHaveBeenCalledWith({ userId: "user-1", locationId: "loc-1" });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Location not found for this user" });
    });

    test("200 when deletedHome is false", async () => {
      Location.deleteClusterById.mockResolvedValue({ deletedCount: 2, deletedHome: false });

      const req = { user: { id: "user-1" }, params: { id: "loc-1" } };
      const res = makeRes();

      await locationController.deleteLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Location removed",
        deletedCount: 2,
        deletedHome: false,
      });
      expect(Location.getUniqueByUserId).not.toHaveBeenCalled();
      expect(Location.setHomeById).not.toHaveBeenCalled();
    });

    test("200 when deletedHome is true and remaining locations exist (sets new home)", async () => {
      Location.deleteClusterById.mockResolvedValue({ deletedCount: 1, deletedHome: true });
      Location.getUniqueByUserId.mockResolvedValue([{ id: "loc-2", label: "Leeds, GB" }]);
      Location.setHomeById.mockResolvedValue({ id: "loc-2", label: "Leeds, GB" });

      const req = { user: { id: "user-1" }, params: { id: "loc-1" } };
      const res = makeRes();

      await locationController.deleteLocation(req, res);

      expect(Location.getUniqueByUserId).toHaveBeenCalledWith("user-1");
      expect(Location.setHomeById).toHaveBeenCalledWith({ userId: "user-1", locationId: "loc-2" });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Location removed",
        deletedCount: 1,
        deletedHome: true,
      });
    });

    test("200 when deletedHome is true and no remaining locations (does not set home)", async () => {
      Location.deleteClusterById.mockResolvedValue({ deletedCount: 1, deletedHome: true });
      Location.getUniqueByUserId.mockResolvedValue([]);

      const req = { user: { id: "user-1" }, params: { id: "loc-1" } };
      const res = makeRes();

      await locationController.deleteLocation(req, res);

      expect(Location.getUniqueByUserId).toHaveBeenCalledWith("user-1");
      expect(Location.setHomeById).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Location removed",
        deletedCount: 1,
        deletedHome: true,
      });
    });

    test("500 when model throws", async () => {
      Location.deleteClusterById.mockRejectedValue(new Error("Delete failed"));

      const req = { user: { id: "user-1" }, params: { id: "loc-1" } };
      const res = makeRes();

      await locationController.deleteLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Delete failed" });
    });
  });
});
