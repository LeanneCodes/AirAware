const db = require('../../../db/connect');
const { getPollutionData, fetchAndStoreReading } = require('../../../services/airQualityService');

jest.mock('../../../db/connect', () => ({
  query: jest.fn(),
}));

describe('airQualityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    process.env.OPENWEATHER_API_KEY = 'test-key';
  });

  describe('getPollutionData', () => {
    it('throws if lat/lon missing', async () => {
      await expect(getPollutionData(null, 0.1)).rejects.toThrow('Latitude and longitude are required');
      await expect(getPollutionData(51.5, null)).rejects.toThrow('Latitude and longitude are required');
    });

    it('returns parsed json from OpenWeather', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ list: [{ main: { aqi: 2 } }] }),
      });

      const result = await getPollutionData(51.5, -0.12);
      expect(result).toHaveProperty('list');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('throws if response not ok', async () => {
      global.fetch.mockResolvedValue({ ok: false, status: 401 });

      await expect(getPollutionData(51.5, -0.12)).rejects.toThrow('Air quality API error: 401');
    });
  });

  describe('fetchAndStoreReading', () => {
    it('throws if API returns no data points', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ list: [] }),
      });

      await expect(
        fetchAndStoreReading({ areaLabel: 'London', latitude: 51.5, longitude: -0.12 })
      ).rejects.toThrow('No air quality data returned');
    });

    it('returns existing id if a reading with same area_label + observed_at exists', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          list: [
            {
              dt: 1700000000,
              main: { aqi: 3 },
              components: { pm2_5: 10, pm10: 20, no2: 30, o3: 40, so2: 50, co: 60 },
            },
          ],
        }),
      });

      db.query.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] }); // existing check

      const id = await fetchAndStoreReading({ areaLabel: 'London', latitude: 51.5, longitude: -0.12 });

      expect(id).toBe('existing-id');
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('inserts and returns new id when no existing reading', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          list: [
            {
              dt: 1700000000,
              main: { aqi: 2 },
              components: { pm2_5: 1, pm10: 2, no2: 3, o3: 4, so2: 5, co: 6 },
            },
          ],
        }),
      });

      db.query
        .mockResolvedValueOnce({ rows: [] }) // existing check
        .mockResolvedValueOnce({ rows: [{ id: 'new-id' }] }); // insert

      const id = await fetchAndStoreReading({ areaLabel: 'London', latitude: 51.5, longitude: -0.12 });

      expect(id).toBe('new-id');

      // 2 queries: existing check + insert
      expect(db.query).toHaveBeenCalledTimes(2);

      // Assert insert was called with expected SQL + values (light check)
      const insertCall = db.query.mock.calls[1];
      expect(insertCall[1]).toEqual(
        expect.arrayContaining(['London', 51.5, -0.12, expect.any(Date), 1, 2, 3, 4, 5, 6, 2])
      );
    });
  });
});
