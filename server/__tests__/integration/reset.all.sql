BEGIN;

TRUNCATE TABLE
  risk_assessment_recommendations,
  risk_assessments,
  air_quality_readings,
  thresholds,
  locations,
  users,
  recommendations
RESTART IDENTITY
CASCADE;

INSERT INTO recommendations (condition_type, min_risk_level, category, text)
VALUES
  ('any', 'High',   'activity', 'You may want to consider reducing prolonged outdoor activity if possible.'),
  ('any', 'Medium', 'general',  'Consider checking air quality again later today as conditions can change.'),
  ('asthma', 'High','general',  'Some users choose to carry their usual reliever inhaler when going out.'),
  ('allergies','High','comfort','Some users find rinsing or saline spray helpful after time outdoors.'),
  ('any', 'Low',    'general',  'Conditions look favourable today based on your profile.');

COMMIT;
