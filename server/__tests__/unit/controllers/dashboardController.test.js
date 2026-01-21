const Dashboard = require('../../../models/Dashboard');
const airQualityService = require('../../../services/airQualityService');
const { getDashboard, refreshDashboard } = require('../../../controllers/dashboardController');

jest.mock('../../../models/Dashboard');
jest.mock('../../../services/airQualityService');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('dashboardController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('returns 401 if req.user missing', async () => {
      const req = {};
      const res = mockRes();

      await getDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorised' });
    });

    it('returns 200 with dashboard payload', async () => {
      Dashboard.buildDashboardPayload.mockResolvedValue({
        location: { label: 'London' },
        current: { aqi: 2, pollutants: { pm25: 1, pm10: 2, no2: 3, o3: 4, so2: 5, co: 6 } },
      });

      const req = { user: { id: 'user-1' } };
      const res = mockRes();

      await getDashboard(req, res);

      expect(Dashboard.buildDashboardPayload).toHaveBeenCalledWith('user-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ location: expect.any(Object) }));
    });
  });

  describe('refreshDashboard', () => {
    it('returns 401 if req.user missing', async () => {
      const req = {};
      const res = mockRes();

      await refreshDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorised' });
    });

    it('returns needs_location state if user has no location', async () => {
      Dashboard.getCurrentLocation.mockResolvedValue(null);

      const req = { user: { id: 'user-1' } };
      const res = mockRes();

      await refreshDashboard(req, res);

      expect(Dashboard.getCurrentLocation).toHaveBeenCalledWith('user-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          state: { needs_location: true },
        })
      );
      expect(airQualityService.fetchAndStoreReading).not.toHaveBeenCalled();
    });

    it('fetches/stores a reading then returns updated dashboard payload', async () => {
      Dashboard.getCurrentLocation.mockResolvedValue({
        label: 'London',
        latitude: 51.5074,
        longitude: -0.1278,
      });

      airQualityService.fetchAndStoreReading.mockResolvedValue('reading-uuid-1');

      Dashboard.buildDashboardPayload.mockResolvedValue({
        location: { label: 'London' },
        current: { aqi: 2, pollutants: { pm25: 1, pm10: 2, no2: 3, o3: 4, so2: 5, co: 6 } },
      });

      const req = { user: { id: 'user-1' } };
      const res = mockRes();

      await refreshDashboard(req, res);

      expect(airQualityService.fetchAndStoreReading).toHaveBeenCalledWith({
        areaLabel: 'London',
        latitude: 51.5074,
        longitude: -0.1278,
      });

      expect(Dashboard.buildDashboardPayload).toHaveBeenCalledWith('user-1');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({
            refreshed: true,
            reading_id: 'reading-uuid-1',
          }),
        })
      );
    });
  });
});
