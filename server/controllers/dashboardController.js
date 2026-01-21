const Dashboard = require('../models/Dashboard');

const getDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorised' });
    }

    const payload = await Dashboard.buildDashboardPayload(userId);

    // If user hasn’t set a location yet, dashboard can’t load readings
    if (!payload.location) {
      return res.status(200).json({
        ...payload,
        state: {
          needs_location: true,
          needs_thresholds: !payload.thresholds || payload.thresholds.trigger_aqi === null,
        },
        message: 'Set your location to see local air quality data.',
      });
    }

    // If there is a location but no reading exists yet, still return useful structure
    if (!payload.current) {
      return res.status(200).json({
        ...payload,
        state: {
          needs_location: false,
          needs_thresholds: !payload.thresholds || payload.thresholds.trigger_aqi === null,
          needs_reading: true,
        },
        message: 'No air quality readings found for this area yet. Try refreshing.',
      });
    }

    // Normal success
    return res.status(200).json({
      ...payload,
      state: {
        needs_location: false,
        needs_thresholds: !payload.thresholds || payload.thresholds.trigger_aqi === null,
        needs_reading: false,
      },
    });
  } catch (err) {
    console.error('Dashboard getDashboard error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getDashboard,
};