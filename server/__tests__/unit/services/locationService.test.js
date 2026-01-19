global.fetch = jest.fn();

const {
  getLocationFromCity,
  getLocationFromPostcode
} = require("../../../services/locationService");

describe("Location Service – City & Postcode", () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  /* CITY */

  describe("getLocationFromCity", () => {
    it("returns coordinates for a valid city", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            name: "London",
            lat: 51.5072,
            lon: -0.1276,
            country: "GB"
          }
        ]
      });

      const result = await getLocationFromCity("London");

      expect(result).toEqual({
        lat: 51.5072,
        lon: -0.1276,
        name: "London"
      });
    });

    it("throws error if city is missing", async () => {
      await expect(getLocationFromCity()).rejects.toThrow("City is required");
    });

    it("throws error if API response is not ok", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await expect(getLocationFromCity("London")).rejects.toThrow(
        "Geocoding API error: 401"
      );
    });

    it("throws error if no location is found", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await expect(getLocationFromCity("InvalidCity")).rejects.toThrow(
        "Location not found"
      );
    });
  });

  /* POSTCODE */

  describe("getLocationFromPostcode", () => {
    it("returns coordinates for a valid postcode", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: "London",
          lat: 51.5014,
          lon: -0.1419,
          country: "GB"
        })
      });

      const result = await getLocationFromPostcode("SW1A 1AA");

      expect(result).toEqual({
        lat: 51.5014,
        lon: -0.1419,
        name: "London"
      });
    });

    it("throws error if postcode is missing", async () => {
      await expect(getLocationFromPostcode()).rejects.toThrow(
        "Postcode is required"
      );
    });

    it("throws error if API response is not ok", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(getLocationFromPostcode("SW1A 1AA")).rejects.toThrow(
        "Geocoding API error: 404"
      );
    });
  });
});
