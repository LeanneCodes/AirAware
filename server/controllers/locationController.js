require('dotenv').config();

const Location = require('../models/Location');

async function setLocation(req, res) {
  const data = {
    userId: req.user?.id,
    city: req.body?.city,
    postcode: req.body?.postcode,
  };

  try {
    if (!data.userId) {
      return res.status(401).json({ error: 'Unauthorised' });
    }

    if ((!data.city && !data.postcode) || (data.city && data.postcode)) {
      return res.status(400).json({
        error: 'Provide either a city or a postcode',
      });
    }

    const location = await Location.newLocation(data);

    return res.status(201).json({ location });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function getLocation(req, res) {
  const userId = req.user?.id;

  try {
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorised' });
    }

    const location = await Location.getLocationByUserId(userId);

    if (!location) {
      return res.status(404).json({ error: 'No saved location found' });
    }

    return res.status(200).json({ location });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function updateLocation(req, res) {
  const data = {
    userId: req.user?.id,
    city: req.body?.city,
    postcode: req.body?.postcode,
  };

  try {
    if (!data.userId) {
      return res.status(401).json({ error: 'Unauthorised' });
    }

    if ((!data.city && !data.postcode) || (data.city && data.postcode)) {
      return res.status(400).json({
        error: 'Provide either a city or a postcode',
      });
    }

    const location = await Location.updateLocationByUserId(data);

    if (!location) {
      return res.status(404).json({ error: 'No saved location found. Use POST /location first.' });
    }

    return res.status(200).json({ location });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function validateLocation(req, res) {
  const data = {
    city: req.query?.city,
    postcode: req.query?.postcode,
  };

  try {
    if ((!data.city && !data.postcode) || (data.city && data.postcode)) {
      return res.status(400).json({
        error: 'Provide either a city or a postcode',
      });
    }

    const result = await Location.resolveLocation(data);

    return res.status(200).json({ result });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function deleteLocation(req, res) {
  const userId = req.user?.id;

  try {
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorised' });
    }

    const deletedLocation = await Location.deleteLocationByUserId(userId);

    if (!deletedLocation) {
      return res.status(404).json({ error: 'No saved location found' });
    }

    return res.status(200).json({ message: 'Location deleted', location: deletedLocation });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getLocationHistory(req, res) {
  const userId = req.user?.id;

  try {
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorised' });
    }

    const locations = await Location.getUniqueByUserId(userId);

    return res.status(200).json({ locations });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  setLocation,
  getLocation,
  updateLocation,
  validateLocation,
  deleteLocation,
  getLocationHistory,
};