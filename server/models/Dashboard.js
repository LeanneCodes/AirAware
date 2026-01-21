const db = require('../db/connect');

const DEFAULT_TRIGGER_AQI = 3;

function riskRank(level) {
  // for filtering recommendations; keep it simple
  if (level === 'High') return 3;
  if (level === 'Medium') return 2;
  return 1;
}

class Dashboard {
  static async buildDashboardPayload(userId) {
    const user = await this.getUser(userId);
    const location = await this.getCurrentLocation(userId);
    const thresholds = await this.getThresholds(userId);

    const effectiveTrigger =
      thresholds?.use_default !== false
        ? DEFAULT_TRIGGER_AQI
        : thresholds?.trigger_aqi ?? DEFAULT_TRIGGER_AQI;

    // If no location set, return early with basics
    if (!location) {
      return {
        user,
        location: null,
        thresholds: thresholds
          ? { ...thresholds, effective_trigger_aqi: effectiveTrigger }
          : { trigger_aqi: null, use_default: true, effective_trigger_aqi: DEFAULT_TRIGGER_AQI },
        current: null,
        status: null,
        recommendations: [],
        alerts: [],
        trend: [],
      };
    }

    const current = await this.getLatestReadingForArea(location.label);
    const alerts = await this.getRecentAlerts(userId, 10);

    // “status” is the latest alert, if any, else derive from current reading
    const latestAlert = alerts[0] || null;

    const status = latestAlert
      ? {
          aqi_label: current?.aqi ?? null,
          risk_level: latestAlert.risk_level,
          dominant_pollutant: latestAlert.dominant_pollutant,
          explanation: latestAlert.explanation,
        }
      : current
        ? {
            aqi_label: current.aqi,
            risk_level: this.deriveRiskLevel(current.aqi, effectiveTrigger),
            dominant_pollutant: this.deriveDominantPollutant(current),
            explanation: 'Based on the latest air quality reading for your area.',
          }
        : null;

    const recommendations = status
      ? await this.getRecommendations(user.condition_type, status.risk_level)
      : [];

    const trend = await this.getTrend(location.label, 24); // last 24 points (or hours)

    return {
      user,
      location,
      thresholds: thresholds
        ? { ...thresholds, effective_trigger_aqi: effectiveTrigger }
        : { trigger_aqi: null, use_default: true, effective_trigger_aqi: DEFAULT_TRIGGER_AQI },
      current,
      status,
      recommendations,
      alerts,
      trend,
    };
  }

  static async getUser(userId) {
    const { rows } = await db.query(
      `SELECT condition_type, sensitivity_level, accessibility_mode
       FROM users
       WHERE id = $1;`,
      [userId]
    );
    return rows[0] || null;
  }

  static async getCurrentLocation(userId) {
    const { rows } = await db.query(
      `SELECT label, latitude, longitude, is_home
       FROM locations
       WHERE user_id = $1
       ORDER BY is_home DESC, created_at DESC
       LIMIT 1;`,
      [userId]
    );
    return rows[0] || null;
  }

  static async getThresholds(userId) {
    const { rows } = await db.query(
      `SELECT trigger_aqi, use_default, updated_at
       FROM thresholds
       WHERE user_id = $1
       LIMIT 1;`,
      [userId]
    );
    return rows[0] || null;
  }

  static async getLatestReadingForArea(areaLabel) {
    const { rows } = await db.query(
      `SELECT observed_at, aqi, pm25, no2, o3, so2, pm10, co
       FROM air_quality_readings
       WHERE area_label = $1
       ORDER BY observed_at DESC
       LIMIT 1;`,
      [areaLabel]
    );

    if (!rows[0]) return null;

    return {
      observed_at: rows[0].observed_at,
      aqi: rows[0].aqi,
      pollutants: {
        pm25: rows[0].pm25,
        no2: rows[0].no2,
        o3: rows[0].o3,
        so2: rows[0].so2,
        pm10: rows[0].pm10,
        co: rows[0].co,
      },
    };
  }

  static async getTrend(areaLabel, limit = 24) {
  const { rows } = await db.query(
    `SELECT observed_at, aqi, pm25, pm10, no2, o3, so2, co
     FROM (
       SELECT observed_at, aqi, pm25, pm10, no2, o3, so2, co
       FROM air_quality_readings
       WHERE area_label = $1
       ORDER BY observed_at DESC
       LIMIT $2
     ) t
     ORDER BY observed_at ASC;`,
    [areaLabel, limit]
  );

  return rows.map(r => ({
    observed_at: r.observed_at,
    aqi: r.aqi,
    pm25: r.pm25,
    pm10: r.pm10,
    no2: r.no2,
    o3: r.o3,
    so2: r.so2,
    co: r.co,
  }));
}

  static async getRecentAlerts(userId, limit = 10) {
    const { rows } = await db.query(
      `SELECT id, created_at, risk_level, dominant_pollutant, explanation
       FROM risk_assessments
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2;`,
      [userId, limit]
    );
    return rows;
  }

  static async getRecommendations(conditionType, riskLevel) {
    // Pull active recs where:
    // - condition matches or is 'any'
    // - min_risk_level is <= current risk
    const { rows } = await db.query(
      `SELECT id, category, text, min_risk_level, condition_type
       FROM recommendations
       WHERE is_active = TRUE
         AND (condition_type = $1 OR condition_type = 'any')
       ORDER BY category ASC;`,
      [conditionType]
    );

    const current = riskRank(riskLevel);
    return rows
      .filter(r => riskRank(r.min_risk_level) <= current)
      .map(r => ({ id: r.id, category: r.category, text: r.text }));
  }

  static deriveRiskLevel(aqi, triggerAqi) {
    if (!aqi) return 'Low';
    if (aqi >= triggerAqi) return 'High';
    if (aqi === triggerAqi - 1) return 'Medium';
    return 'Low';
  }

  static deriveDominantPollutant(current) {
    const p = current?.pollutants;
    if (!p) return 'Unknown';

    const candidates = [
      ['pm25', p.pm25],
      ['no2', p.no2],
      ['o3', p.o3],
      ['so2', p.so2],
      ['pm10', p.pm10],
      ['co', p.co],
    ].filter(([, v]) => typeof v === 'number' || v !== null);

    if (!candidates.length) return 'Unknown';

    candidates.sort((a, b) => (b[1] ?? -Infinity) - (a[1] ?? -Infinity));
    return candidates[0][0].toUpperCase();
  }
}

module.exports = Dashboard;
