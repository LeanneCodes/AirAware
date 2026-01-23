// controllers/dashboardController.js
const Dashboard = require('../models/Dashboard');
const airQualityService = require('../services/airQualityService');

const getDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    // Build from DB first (fast path)
    let payload = await Dashboard.buildDashboardPayload(userId);

    // If user has a location but no reading yet in DB, fetch once and rebuild
    if (payload.location && !payload.current) {
      await airQualityService.fetchAndStoreReading({
        areaLabel: payload.location.label,
        latitude: payload.location.latitude,
        longitude: payload.location.longitude,
      });

      payload = await Dashboard.buildDashboardPayload(userId);
    }

    return res.status(200).json(payload);
  } catch (err) {
    console.error('Dashboard getDashboard error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const refreshDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const location = await Dashboard.getCurrentLocation(userId);

    if (!location) {
      return res.status(200).json({
        state: { needs_location: true },
        message: 'Set your location before refreshing.',
      });
    }

    const readingId = await airQualityService.fetchAndStoreReading({
      areaLabel: location.label,
      latitude: location.latitude,
      longitude: location.longitude,
    });

    const payload = await Dashboard.buildDashboardPayload(userId);

    return res.status(200).json({
      ...payload,
      meta: { refreshed: true, reading_id: readingId },
    });
  } catch (err) {
    console.error('Dashboard refreshDashboard error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getDashboard, refreshDashboard };
