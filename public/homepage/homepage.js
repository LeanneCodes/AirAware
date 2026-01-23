/*
  What this file does:
  1) Waits for the homepage HTML to load
  2) Checks if the user is logged in (token in localStorage)
     - If no token, it leaves the homepage static (no API calls)
  3) If token exists, fetches dashboard data from /api/dashboard
  4) Uses that data to fill small homepage UI widgets:
     - Location label + "View on map" link
     - Mini map (Leaflet) if available
     - User sensitivity level
     - Dominant pollutant
*/

document.addEventListener("DOMContentLoaded", () => {
  const TOKEN_KEY = "airaware_token";

  // Kick off the async work in a separate function.
  // This keeps the DOMContentLoaded callback simple and readable.
  initHomepage(TOKEN_KEY);
});

/* -----------------------------
   1) Main initialiser
-------------------------------- */

async function initHomepage(tokenKey) {
  const token = localStorage.getItem(tokenKey);

  // No token means user is not logged in (or token expired/cleared).
  // We intentionally do nothing so the homepage can still load normally.
  if (!token) {
    console.warn("No auth token found – homepage will stay static");
    return;
  }

  try {
    const payload = await fetchDashboard(token);
    renderHomepage(payload);
  } catch (err) {
    // We log errors but do not show alerts on homepage.
    // Homepage should feel lightweight and not disruptive.
    console.error("Homepage load error:", err);
  }
}

/* -----------------------------
   2) API function (data loading only)
-------------------------------- */

async function fetchDashboard(token) {
  const res = await fetch("/api/dashboard", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    // If this fails, user might be logged out, token invalid, or server issue.
    throw new Error(`Dashboard fetch failed (${res.status})`);
  }

  return res.json();
}

/* -----------------------------
   3) Render function (DOM updates only)
-------------------------------- */

function renderHomepage(payload) {
  const { location, user, status } = payload || {};

  renderLocationSection(location);
  renderSensitivity(user);
  renderDominantPollutant(status);
}

/* -----------------------------
   4) Small render helpers (one job each)
-------------------------------- */

function renderLocationSection(location) {
  // If we do not have a location yet, skip the whole location UI.
  if (!location) return;

  const labelEl = document.getElementById("locationLabel");
  const mapLink = document.getElementById("viewOnMap");

  // 1) Location label
  if (labelEl) labelEl.textContent = location.label;

  // 2) Google Maps link
  if (mapLink) {
    mapLink.href = buildGoogleMapsLink(location.latitude, location.longitude);
  }

  // 3) Mini map (Leaflet)
  // Leaflet exposes itself as "L" on window, so we check for it safely.
  // Also check the container exists, otherwise Leaflet will throw.
  if (window.L && document.getElementById("miniMap")) {
    renderMiniMap(location);
  }
}

function renderSensitivity(user) {
  const sensitivityEl = document.getElementById("userSensitivity");
  if (!sensitivityEl) return;

  const level = user?.sensitivity_level;
  if (!level) return;

  // Example: "medium" -> "Medium"
  sensitivityEl.textContent = capitaliseFirstLetter(level);
}

function renderDominantPollutant(status) {
  const pollutantEl = document.getElementById("primaryPollutant");
  if (!pollutantEl) return;

  const dominant = status?.dominant_pollutant;
  if (!dominant) return;

  pollutantEl.textContent = dominant;
}

/* -----------------------------
   5) Leaflet map renderer (isolated so it is easy to remove/replace later)
-------------------------------- */

function renderMiniMap(location) {
  const lat = Number(location.latitude);
  const lon = Number(location.longitude);

  // Guard against bad values (Leaflet will error if lat/lon are invalid).
  if (Number.isNaN(lat) || Number.isNaN(lon)) return;

  const map = L.map("miniMap", {
    zoomControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false,
  }).setView([lat, lon], 11);

  // Base map tiles (OpenStreetMap)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
  }).addTo(map);

  // Marker on the chosen location
  L.marker([lat, lon]).addTo(map);
}

/* -----------------------------
   6) Tiny utilities
-------------------------------- */

function buildGoogleMapsLink(lat, lon) {
  // encodeURIComponent makes this safer if values are ever strings.
  return `https://www.google.com/maps?q=${encodeURIComponent(lat)},${encodeURIComponent(lon)}`;
}

function capitaliseFirstLetter(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
