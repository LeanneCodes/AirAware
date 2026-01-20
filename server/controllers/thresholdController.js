require('dotenv').config();

const Threshold = require('../models/Threshold');

const AQI_MAP = {
  good: 1,
  fair: 2,
  moderate: 3,
  poor: 4,
  very_poor: 5,
};

const DEFAULT_TRIGGER_AQI = 3; // Moderate

function normaliseChoice(value) {
  if (!value) return null;
  return String(value).trim().toLowerCase();
}

async function getThresholds(req, res) {
  const userId = req.user?.id;

  try {
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const thresholds = await Threshold.getByUserId(userId);

    if (!thresholds) {
      return res.status(404).json({ error: 'No thresholds found' });
    }

    const effectiveTriggerAqi = thresholds.useDefault
      ? DEFAULT_TRIGGER_AQI
      : thresholds.triggerAqi;

    return res.status(200).json({
      thresholds,
      effectiveTriggerAqi,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function setThresholds(req, res) {
  const userId = req.user?.id;
  const choice = normaliseChoice(req.body?.sensitivity);

  try {
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    if (!choice) {
      return res.status(400).json({ error: 'sensitivity is required' });
    }

    let data;

    if (choice === 'unknown' || choice === "i don't know" || choice === 'i dont know') {
      data = { userId, useDefault: true, triggerAqi: null };
    } else if (AQI_MAP[choice]) {
      data = { userId, useDefault: false, triggerAqi: AQI_MAP[choice] };
    } else {
      return res.status(400).json({
        error: 'sensitivity must be one of: good, fair, moderate, poor, very_poor, unknown',
      });
    }

    const created = await Threshold.newThresholds(data);

    const effectiveTriggerAqi = created.useDefault ? DEFAULT_TRIGGER_AQI : created.triggerAqi;

    return res.status(201).json({
      thresholds: created,
      effectiveTriggerAqi,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function updateThresholds(req, res) {
  const userId = req.user?.id;
  const choice = normaliseChoice(req.body?.sensitivity);

  try {
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    if (!choice) {
      return res.status(400).json({ error: 'sensitivity is required' });
    }

    let data;

    if (choice === 'unknown' || choice === "i don't know" || choice === 'i dont know') {
      data = { userId, useDefault: true, triggerAqi: null };
    } else if (AQI_MAP[choice]) {
      data = { userId, useDefault: false, triggerAqi: AQI_MAP[choice] };
    } else {
      return res.status(400).json({
        error: 'sensitivity must be one of: good, fair, moderate, poor, very_poor, unknown',
      });
    }

    const updated = await Threshold.updateThresholdsByUserId(data);

    if (!updated) {
      return res.status(404).json({ error: 'No thresholds found. Use POST /api/thresholds first.' });
    }

    const effectiveTriggerAqi = updated.useDefault ? DEFAULT_TRIGGER_AQI : updated.triggerAqi;

    return res.status(200).json({
      thresholds: updated,
      effectiveTriggerAqi,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function getDefaultThresholds(req, res) {
  try {
    return res.status(200).json({
      defaults: {
        useDefault: true,
        triggerAqi: DEFAULT_TRIGGER_AQI,
        sensitivity: 'moderate',
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getThresholds,
  setThresholds,
  updateThresholds,
  getDefaultThresholds,
};