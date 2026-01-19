require('dotenv').config();

const apiKey = process.env.OPENWEATHER_API_KEY;

async function getPollutionData(lat, lon) {
  if (!lat || !lon) {
    throw new Error('Latitude and longitude are required');
  }

  const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Air quality API error: ${response.status}`);
  }

  const result = await response.json();

  return result;
}

/* Allow direct execution for local testing only */
if (require.main === module) {
  (async () => {
    try {
      const data = await getPollutionData(51.5072, 0.1276);
      console.log(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err.message);
    }
  })();
}

module.exports = { getPollutionData };
