const Location = require('../../../models/Location');
const db = require('../../../db/connect');

jest.mock('../../../db/connect', () => ({
  query: jest.fn(),
}));

describe('Location model (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENWEATHER_API_KEY = 'test-key';

    global.fetch = jest.fn(async (url) => {
      // City direct geocode
      if (url.includes('/geo/1.0/direct')) {
        return {
          ok: true,
          json: async () => [{ name: 'London', country: 'GB', lat: 51.5073, lon: -0.1276 }],
        };
      }

      // Postcode zip geocode
      if (url.includes('/geo/1.0/zip')) {
        return {
          ok: true,
          json: async () => ({ name: 'LS1 1AD', country: 'GB', lat: 53.7961, lon: -1.5536 }),
        };
      }

      // Reverse geocode
      if (url.includes('/geo/1.0/reverse')) {
        return {
          ok: true,
          json: async () => [{ name: 'Leeds' }],
        };
      }

      return { ok: false, json: async () => ({}) };
    });
  });

  describe('resolveLocation', () => {
    test('resolves a city to label + coordinates', async () => {
      const result = await Location.resolveLocation({ city: '  London  ' });

      expect(result).toEqual({
        label: 'London, GB',
        latitude: 51.5073,
        longitude: -0.1276,
      });
    });

    test('resolves a postcode and uses reverse geocoding for city label', async () => {
      const result = await Location.resolveLocation({ postcode: ' ls1 1ad ' });

      expect(result.label).toBe('Leeds, GB');
      expect(result.latitude).toBe(53.7961);
      expect(result.longitude).toBe(-1.5536);
    });

    test('throws if both city and postcode provided', async () => {
      await expect(
        Location.resolveLocation({ city: 'London', postcode: 'LS1 1AD' })
      ).rejects.toThrow('Provide either a city or a postcode');
    });
  });

  describe('newLocation', () => {
    test('inserts a new home location and returns a Location instance', async () => {
      // home unset query
      db.query
        .mockResolvedValueOnce({ rows: [] }) // UPDATE locations SET is_home = FALSE...
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'loc-1',
              user_id: 'user-1',
              label: 'London, GB',
              latitude: '51.5073',
              longitude: '-0.1276',
              is_home: true,
              created_at: new Date().toISOString(),
            },
          ],
        });

      const loc = await Location.newLocation({ userId: 'user-1', city: 'London' });

      expect(db.query).toHaveBeenCalled();
      expect(loc).toBeInstanceOf(Location);
      expect(loc.label).toBe('London, GB');
      expect(loc.isHome).toBe(true);
    });
  });

  describe('getLocationByUserId', () => {
    test('returns null if no location exists', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const loc = await Location.getLocationByUserId('user-1');
      expect(loc).toBeNull();
    });

    test('returns a Location instance if found', async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'loc-1',
            user_id: 'user-1',
            label: 'London, GB',
            latitude: '51.5073',
            longitude: '-0.1276',
            is_home: true,
            created_at: new Date().toISOString(),
          },
        ],
      });

      const loc = await Location.getLocationByUserId('user-1');
      expect(loc).toBeInstanceOf(Location);
      expect(loc.label).toBe('London, GB');
    });
  });

  describe('updateLocationByUserId', () => {
    test('returns null if no active location exists', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // getActiveLocationRow

      const updated = await Location.updateLocationByUserId({ userId: 'user-1', city: 'London' });
      expect(updated).toBeNull();
    });

    test('updates active location and returns Location instance', async () => {
      db.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'loc-1',
              user_id: 'user-1',
              label: 'Old, GB',
              latitude: '0',
              longitude: '0',
              is_home: true,
              created_at: new Date().toISOString(),
            },
          ],
        }) // getActiveLocationRow
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'loc-1',
              user_id: 'user-1',
              label: 'London, GB',
              latitude: '51.5073',
              longitude: '-0.1276',
              is_home: true,
              created_at: new Date().toISOString(),
            },
          ],
        }); // UPDATE ... RETURNING *

      const updated = await Location.updateLocationByUserId({ userId: 'user-1', city: 'London' });

      expect(updated).toBeInstanceOf(Location);
      expect(updated.label).toBe('London, GB');
    });
  });

  describe('deleteLocationByUserId', () => {
    test('returns null if no active location exists', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // getActiveLocationRow

      const deleted = await Location.deleteLocationByUserId('user-1');
      expect(deleted).toBeNull();
    });

    test('deletes active location and returns Location instance', async () => {
      db.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'loc-1',
              user_id: 'user-1',
              label: 'London, GB',
              latitude: '51.5073',
              longitude: '-0.1276',
              is_home: true,
              created_at: new Date().toISOString(),
            },
          ],
        }) // getActiveLocationRow
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'loc-1',
              user_id: 'user-1',
              label: 'London, GB',
              latitude: '51.5073',
              longitude: '-0.1276',
              is_home: true,
              created_at: new Date().toISOString(),
            },
          ],
        }); // DELETE ... RETURNING *

      const deleted = await Location.deleteLocationByUserId('user-1');
      expect(deleted).toBeInstanceOf(Location);
      expect(deleted.label).toBe('London, GB');
    });
  });

  describe('getUniqueByUserId', () => {
    test('returns array of Location instances', async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'loc-1',
            user_id: 'user-1',
            label: 'London, GB',
            latitude: '51.5073',
            longitude: '-0.1276',
            is_home: true,
            created_at: new Date().toISOString(),
          },
          {
            id: 'loc-2',
            user_id: 'user-1',
            label: 'Leeds, GB',
            latitude: '53.7961',
            longitude: '-1.5536',
            is_home: false,
            created_at: new Date().toISOString(),
          },
        ],
      });

      const list = await Location.getUniqueByUserId('user-1');
      expect(Array.isArray(list)).toBe(true);
      expect(list[0]).toBeInstanceOf(Location);
    });
  });
});
