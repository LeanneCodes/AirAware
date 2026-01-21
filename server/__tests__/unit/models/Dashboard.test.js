const db = require('../../../db/connect');
const Dashboard = require('../../../models/Dashboard');

jest.mock('../../../db/connect', () => ({
  query: jest.fn(),
}));

describe('Dashboard model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentLocation', () => {
    it('returns the current/home location when found', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ label: 'London', latitude: '51.507400', longitude: '-0.127800', is_home: true }],
      });

      const result = await Dashboard.getCurrentLocation('user-1');

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(
        expect.objectContaining({
          label: 'London',
          latitude: '51.507400',
          longitude: '-0.127800',
        })
      );
    });

    it('returns null when user has no location', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await Dashboard.getCurrentLocation('user-1');

      expect(result).toBeNull();
    });
  });

  describe('getLatestReadingForArea', () => {
    it('returns latest reading with six pollutants', async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          {
            observed_at: new Date('2026-01-21T09:00:00Z'),
            aqi: 2,
            pm25: '1.0000',
            pm10: '2.0000',
            no2: '3.0000',
            o3: '4.0000',
            so2: '5.0000',
            co: '6.0000',
          },
        ],
      });

      const reading = await Dashboard.getLatestReadingForArea('London');

      expect(reading).toEqual({
        observed_at: new Date('2026-01-21T09:00:00Z'),
        aqi: 2,
        pollutants: {
          pm25: '1.0000',
          pm10: '2.0000',
          no2: '3.0000',
          o3: '4.0000',
          so2: '5.0000',
          co: '6.0000',
        },
      });
    });

    it('returns null when no readings exist', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const reading = await Dashboard.getLatestReadingForArea('London');

      expect(reading).toBeNull();
    });
  });

  describe('buildDashboardPayload', () => {
    it('returns payload with state when no location exists', async () => {
      // 1) getUser
      db.query.mockResolvedValueOnce({
        rows: [{ condition_type: 'asthma', sensitivity_level: 'medium', accessibility_mode: false }],
      });

      // 2) getCurrentLocation
      db.query.mockResolvedValueOnce({ rows: [] });

      // 3) getThresholds
      db.query.mockResolvedValueOnce({
        rows: [{ trigger_aqi: null, use_default: true, updated_at: new Date() }],
      });

      const payload = await Dashboard.buildDashboardPayload('user-1');

      expect(payload.location).toBeNull();
      expect(payload.current).toBeNull();
      expect(payload.recommendations).toEqual([]);
      expect(payload.alerts).toEqual([]);
      expect(payload.trend).toEqual([]);

      // default trigger should be present (3 in your earlier logic)
      expect(payload.thresholds).toHaveProperty('effective_trigger_aqi');
    });

    it('returns full payload when everything exists', async () => {
      // Call order (typical):
      // 1) getUser
      // 2) getCurrentLocation
      // 3) getThresholds
      // 4) getLatestReadingForArea
      // 5) getRecentAlerts
      // 6) getRecommendations
      // 7) getTrend

      db.query
        // 1) getUser
        .mockResolvedValueOnce({
          rows: [{ condition_type: 'asthma', sensitivity_level: 'medium', accessibility_mode: false }],
        })
        // 2) getCurrentLocation
        .mockResolvedValueOnce({
          rows: [{ label: 'London', latitude: '51.507400', longitude: '-0.127800', is_home: true }],
        })
        // 3) getThresholds
        .mockResolvedValueOnce({
          rows: [{ trigger_aqi: 3, use_default: false, updated_at: new Date() }],
        })
        // 4) getLatestReadingForArea
        .mockResolvedValueOnce({
          rows: [
            {
              observed_at: new Date('2026-01-21T09:00:00Z'),
              aqi: 2,
              pm25: '1.0000',
              pm10: '2.0000',
              no2: '3.0000',
              o3: '4.0000',
              so2: '5.0000',
              co: '6.0000',
            },
          ],
        })
        // 5) getRecentAlerts
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'alert-1',
              created_at: new Date('2026-01-21T08:30:00Z'),
              risk_level: 'Medium',
              dominant_pollutant: 'NO2',
              explanation: 'Example alert.',
            },
          ],
        })
        // 6) getRecommendations (model may filter these)
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'rec-1',
              category: 'general',
              text: 'Consider checking air quality again later today as conditions can change.',
              min_risk_level: 'Medium',
              condition_type: 'any',
            },
          ],
        })
        // 7) getTrend
        .mockResolvedValueOnce({
          rows: [
            {
              observed_at: new Date('2026-01-21T08:00:00Z'),
              aqi: 3,
              pm25: '2.0000',
              pm10: '4.0000',
              no2: '10.0000',
              o3: '20.0000',
              so2: '1.0000',
              co: '200.0000',
            },
            {
              observed_at: new Date('2026-01-21T09:00:00Z'),
              aqi: 2,
              pm25: '1.0000',
              pm10: '2.0000',
              no2: '3.0000',
              o3: '4.0000',
              so2: '5.0000',
              co: '6.0000',
            },
          ],
        });

      const payload = await Dashboard.buildDashboardPayload('user-1');

      expect(payload.user).toEqual(
        expect.objectContaining({ condition_type: 'asthma' })
      );

      expect(payload.location).toEqual(
        expect.objectContaining({ label: 'London' })
      );

      expect(payload.current).toEqual(
        expect.objectContaining({
          aqi: 2,
          pollutants: expect.objectContaining({
            pm25: '1.0000',
            pm10: '2.0000',
            no2: '3.0000',
            o3: '4.0000',
            so2: '5.0000',
            co: '6.0000',
          }),
        })
      );

      expect(payload.alerts.length).toBeGreaterThan(0);
      expect(payload.recommendations.length).toBeGreaterThan(0);
      expect(payload.trend.length).toBe(2);

      // Ensure your graph data is chronological (oldest -> newest)
      expect(new Date(payload.trend[0].observed_at).getTime())
        .toBeLessThan(new Date(payload.trend[1].observed_at).getTime());
    });
  });
});
