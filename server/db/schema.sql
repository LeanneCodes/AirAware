BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,

  condition_type VARCHAR(12) NOT NULL
    CHECK (condition_type IN ('asthma','allergies','both')),
  sensitivity_level VARCHAR(8) NOT NULL
    CHECK (sensitivity_level IN ('low','medium','high')),

  accessibility_mode BOOLEAN NOT NULL DEFAULT FALSE,
  analytics_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_disclaimer_at TIMESTAMP NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  label VARCHAR(80) NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  is_home BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);

CREATE TABLE IF NOT EXISTS thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- User's trigger level (OpenWeather AQI 1–5). NULL when user selects "I don't know"
  trigger_aqi INTEGER NULL
    CHECK (trigger_aqi BETWEEN 1 AND 5),

  -- If TRUE, app uses the default trigger (e.g. Moderate = 3)
  use_default BOOLEAN NOT NULL DEFAULT TRUE,

  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS air_quality_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  source VARCHAR(50) NOT NULL DEFAULT 'public_api',
  area_label VARCHAR(80) NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  observed_at TIMESTAMP NOT NULL,

  pm25 DECIMAL(10,4) NULL,
  no2 DECIMAL(10,4) NULL,
  o3 DECIMAL(10,4) NULL,
  so2 DECIMAL(10,4) NULL,
  pm10 DECIMAL(10,4) NULL,
  co DECIMAL(10,4) NULL,
  aqi INTEGER NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE air_quality_readings
  ADD COLUMN IF NOT EXISTS pm10 DECIMAL(10,4) NULL,
  ADD COLUMN IF NOT EXISTS so2  DECIMAL(10,4) NULL,
  ADD COLUMN IF NOT EXISTS co   DECIMAL(10,4) NULL;

CREATE INDEX IF NOT EXISTS idx_aq_area_time
  ON air_quality_readings(area_label, observed_at);

CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_id UUID NOT NULL REFERENCES air_quality_readings(id) ON DELETE RESTRICT,

  risk_level VARCHAR(6) NOT NULL
    CHECK (risk_level IN ('Low','Medium','High')),

  dominant_pollutant VARCHAR(10) NOT NULL DEFAULT 'Unknown',
  explanation VARCHAR(240) NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_user_time
  ON risk_assessments(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  condition_type VARCHAR(12) NOT NULL
    CHECK (condition_type IN ('asthma','allergies','both','any')),

  min_risk_level VARCHAR(6) NOT NULL
    CHECK (min_risk_level IN ('Low','Medium','High')),

  category VARCHAR(30) NOT NULL,
  text VARCHAR(200) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS risk_assessment_recommendations (
  risk_assessment_id UUID NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE,
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE RESTRICT,
  PRIMARY KEY (risk_assessment_id, recommendation_id)
);

INSERT INTO recommendations (condition_type, min_risk_level, category, text)
VALUES
  ('any', 'High',   'activity', 'You may want to consider reducing prolonged outdoor activity if possible.'),
  ('any', 'Medium', 'general',  'Consider checking air quality again later today as conditions can change.'),
  ('asthma', 'High','general',  'Some users choose to carry their usual reliever inhaler when going out.'),
  ('allergies','High','comfort','Some users find rinsing or saline spray helpful after time outdoors.'),
  ('any', 'Low',    'general',  'Conditions look favourable today based on your profile.');

COMMIT;
