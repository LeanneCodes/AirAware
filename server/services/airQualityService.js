require('dotenv').config();

const apiKey = process.env.OPENWEATHER_API_KEY
const lat = 51.5072
const lon = 0.1276

async function getPollutionData() {
  const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    console.log(result);
  } catch (error) {
    console.error(error.message);
  }
}

getPollutionData()