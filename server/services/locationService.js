require("dotenv").config();

const apiKey = process.env.OPENWEATHER_API_KEY;
const COUNTRY_CODE = "GB";

// City Name API
async function getLocationFromCity(city) {
  if (!city) {
    throw new Error("City is required");
  }

  const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
    city
  )},${COUNTRY_CODE}&limit=1&appid=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.length) {
    throw new Error("Location not found");
  }

  return {
    lat: data[0].lat,
    lon: data[0].lon,
    name: data[0].name
  };
}

// Postcode API
async function getLocationFromPostcode(postcode) {
  if (!postcode) {
    throw new Error("Postcode is required");
  }

  const url = `http://api.openweathermap.org/geo/1.0/zip?zip=${encodeURIComponent(
    postcode
  )},${COUNTRY_CODE}&appid=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    lat: data.lat,
    lon: data.lon,
    name: data.name
  };
}

module.exports = {
  getLocationFromCity,
  getLocationFromPostcode
};