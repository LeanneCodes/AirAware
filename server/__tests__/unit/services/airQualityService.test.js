require('dotenv').config();

test('OpenWeather API returns air quality data', async () => {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/air_pollution?lat=51.5072&lon=0.1276&appid=${process.env.OPENWEATHER_API_KEY}`
  );

  const data = await response.json();

  expect(data).toHaveProperty('list');
});
