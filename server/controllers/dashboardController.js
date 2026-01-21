const Dashboard = require('../models/Dashboard');
const airQualityService = require('../services/airQualityService');

const getDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const payload = await Dashboard.buildDashboardPayload(userId);
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

    // Use the user’s current/home location
    const location = await Dashboard.getCurrentLocation(userId);
    if (!location) {
      return res.status(200).json({
        state: { needs_location: true },
        message: 'Set your location before refreshing.',
      });
    }

    // Fetch latest from API and persist
    const readingId = await airQualityService.fetchAndStoreReading({
      areaLabel: location.label,
      latitude: location.latitude,
      longitude: location.longitude,
    });

    // Return updated dashboard
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
