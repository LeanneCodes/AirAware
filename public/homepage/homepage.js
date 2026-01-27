/*
  What this file does:
  1) Waits for the homepage HTML to load
  2) Checks if the user is logged in (token in localStorage)
     - If no token, it leaves the homepage static (no API calls)
  3) If token exists, fetches dashboard data from /api/dashboard
  4) Uses that data to fill small homepage UI widgets
  5) Lets the user refresh the homepage snapshot using /api/dashboard/refresh
     - The homepage shows "refreshed time"
*/

document.addEventListener("DOMContentLoaded", () => {
  const TOKEN_KEY = "token";
  initHomepage(TOKEN_KEY);
});

let lastRefreshedAt = null;

/* -----------------------------
   1) Main initialiser
-------------------------------- */

async function initHomepage(tokenKey) {
  wireRefreshButton(tokenKey);

  const token = localStorage.getItem(tokenKey);
  if (!token) return;

  try {
    const payload = await fetchDashboard(token);
    renderHomepage(payload);
  } catch (err) {
    console.error("Homepage load error:", err);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refreshHomepageSnapshot(tokenKey);
    }
  });
}

function wireRefreshButton(tokenKey) {
  const refreshBtn = document.getElementById("homeRefreshBtn");
  if (!refreshBtn) return;

  refreshBtn.addEventListener("click", async () => {
    refreshBtn.disabled = true;

    const prevText = refreshBtn.textContent;
    refreshBtn.textContent = "Refreshing…";

    try {
      await refreshHomepageSnapshot(tokenKey);
    } catch (err) {
      console.error("Homepage refresh error:", err);
    } finally {
      refreshBtn.textContent = prevText;
      refreshBtn.disabled = false;
    }
  });
}

/* -----------------------------
   2) API functions
-------------------------------- */

async function fetchDashboard(token) {
  const res = await fetch(`${window.API_BASE}/api/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error(`Dashboard fetch failed (${res.status})`);
  return res.json();
}

async function refreshDashboard(token) {
  const res = await fetch(`${window.API_BASE}/api/dashboard/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) throw new Error(`Dashboard refresh failed (${res.status})`);
  return res.json();
}

async function refreshHomepageSnapshot(tokenKey) {
  const token = localStorage.getItem(tokenKey);
  if (!token) return;

  const payload = await refreshDashboard(token);

  lastRefreshedAt = new Date();

  renderHomepage(payload);
}

/* -----------------------------
   3) Render function
-------------------------------- */

function renderHomepage(payload) {
  const { location, user, status, current } = payload || {};

  renderWelcomeUser(user);
  renderSensitivity(user, payload?.thresholds);
  renderSnapshot(current, status, payload?.thresholds);
  renderLocationSection(location);
}

/* -----------------------------
   4) Helpers
-------------------------------- */

const POLLUTANT_BANDS = {
  so2: [
    { idx: 1, min: 0, max: 20 },
    { idx: 2, min: 20, max: 80 },
    { idx: 3, min: 80, max: 250 },
    { idx: 4, min: 250, max: 350 },
    { idx: 5, min: 350, max: Infinity },
  ],
  no2: [
    { idx: 1, min: 0, max: 40 },
    { idx: 2, min: 40, max: 70 },
    { idx: 3, min: 70, max: 150 },
    { idx: 4, min: 150, max: 200 },
    { idx: 5, min: 200, max: Infinity },
  ],
  pm10: [
    { idx: 1, min: 0, max: 20 },
    { idx: 2, min: 20, max: 50 },
    { idx: 3, min: 50, max: 100 },
    { idx: 4, min: 100, max: 200 },
    { idx: 5, min: 200, max: Infinity },
  ],
  pm25: [
    { idx: 1, min: 0, max: 10 },
    { idx: 2, min: 10, max: 25 },
    { idx: 3, min: 25, max: 50 },
    { idx: 4, min: 50, max: 75 },
    { idx: 5, min: 75, max: Infinity },
  ],
  o3: [
    { idx: 1, min: 0, max: 60 },
    { idx: 2, min: 60, max: 100 },
    { idx: 3, min: 100, max: 140 },
    { idx: 4, min: 140, max: 180 },
    { idx: 5, min: 180, max: Infinity },
  ],
  co: [
    { idx: 1, min: 0, max: 4400 },
    { idx: 2, min: 4400, max: 9400 },
    { idx: 3, min: 9400, max: 12400 },
    { idx: 4, min: 12400, max: 15400 },
    { idx: 5, min: 15400, max: Infinity },
  ],
};

function aqiName(n) {
  const map = { 1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor" };
  return map[n] || "—";
}

function triggerBandLabel(n) {
  const map = { 1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor" };
  return map[n] || "—";
}


function sensitivityLabelFromTriggerIdx(n) {
  const map = {
    1: "Very sensitive",
    2: "Sensitive",
    3: "Moderately sensitive",
    4: "Slightly sensitive",
    5: "Not sensitive",
  };
  return map[n] || "—";
}


function aqiClassFromIndex(n) {
  const map = {
    1: "aqi-good",
    2: "aqi-fair",
    3: "aqi-moderate",
    4: "aqi-poor",
    5: "aqi-very-poor",
  };
  return map[n] || "";
}

function round(x) {
  if (x === null || x === undefined) return "—";
  const n = Number(x);
  if (Number.isNaN(n)) return "—";
  return n >= 100 ? String(Math.round(n)) : String(Math.round(n * 10) / 10);
}

function formatRefreshedAt(dateObj) {
  if (!dateObj) return "—";
  return dateObj.toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function buildGoogleMapsLink(lat, lon) {
  return `https://www.google.com/maps?q=${encodeURIComponent(lat)},${encodeURIComponent(lon)}`;
}

function capitaliseFirstLetter(str) {
  if (!str) return "—";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function uiLabelFromUiValue(v) {
  const map = {
    "very-sensitive": "Very sensitive",
    "sensitive": "Sensitive",
    "moderate": "Moderately sensitive",
    "slight": "Slightly sensitive",
    "not-sensitive": "Not sensitive",
    "unknown": "Moderately sensitive",
  };
  return map[v] || "—";
}
function uiLabelFromTriggerIdx(triggerIdx) {
  const map = {
    2: "Very sensitive",
    3: "Sensitive",
    4: "Moderately sensitive",
    5: "Not sensitive",
  };
  return map[triggerIdx] || "—";
}


/* -----------------------------
   5) Render: welcome, sensitivity, snapshot
-------------------------------- */

function renderWelcomeUser(user) {
  const el = document.getElementById("welcomeUserName");
  if (!el) return;

  const name =
    user?.first_name ||
    (user?.email ? String(user.email).split("@")[0] : null) ||
    "User";

  el.textContent = name;
}

function renderSensitivity(user, thresholds) {
  const triggerIdx = thresholds?.effective_trigger_aqi ?? null;
  const useDefault = thresholds?.use_default !== false;

  const uiValue = localStorage.getItem("sensitivity_ui");
  if (uiValue) {
    setText("userSensitivity", uiLabelFromUiValue(uiValue));
    setText("userSensitivityMeta", "Personal setting");
    return;
  }

  if (triggerIdx) {
    setText("userSensitivity", uiLabelFromTriggerIdx(triggerIdx));
    setText("userSensitivityMeta", useDefault ? "Default setting" : "Personal setting");
    return;
  }

  const level = user?.sensitivity_level;
  setText("userSensitivity", level ? capitaliseFirstLetter(level) : "—");
  setText("userSensitivityMeta", "Personal setting");
}


function renderSnapshot(current, status, thresholds) {
  if (!current) return;

  const aqi = current?.aqi ?? null;
  const labelEl = document.getElementById("snapshotAQLabel");

  if (labelEl) {
    labelEl.textContent = aqiName(aqi);
    labelEl.classList.remove("aqi-good", "aqi-fair", "aqi-moderate", "aqi-poor", "aqi-very-poor");
    const cls = aqiClassFromIndex(aqi);
    if (cls) labelEl.classList.add(cls);
  }

const triggerIdx = thresholds?.effective_trigger_aqi ?? null;
const triggerBand = triggerBandLabel(triggerIdx);

const snapshotCard = document.getElementById("snapshotCard");
const noteEl = document.getElementById("snapshotAQNote");

let note = "Based on current air quality in this area.";
let alertActive = false;

if (triggerIdx && aqi) {
  const triggerName = aqiName(triggerIdx);
  const currentName = aqiName(aqi);

  if (aqi >= triggerIdx) {
    alertActive = true;
    note = `Alert condition met based on your sensitivity setting, see the dashboard for recommended actions.`;
  } else {
    note = `No alert needed right now. Alerts start when air quality becomes ${triggerName} or Worse.` ;
  }
}

/* Apply text */
if (noteEl) {
  noteEl.textContent = note;
  noteEl.classList.toggle("alert-text", alertActive);
}

/* Apply card emphasis */
if (snapshotCard) {
  snapshotCard.classList.toggle("alert-active", alertActive);
}

  const p = current?.pollutants || {};
  setText("badgePm25", `PM₂.₅: ${round(p.pm25)}`);
  setText("badgePm10", `PM₁₀: ${round(p.pm10)}`);
  setText("badgeNo2", `NO₂: ${round(p.no2)}`);
  setText("badgeO3", `O₃: ${round(p.o3)}`);
  setText("badgeSo2", `SO₂: ${round(p.so2)}`);
  setText("badgeCo", `CO: ${round(p.co)}`);

  // Show REFRESHED time only (client-side)
  setText("badgeUpdated", `Updated: ${formatRefreshedAt(lastRefreshedAt)}`);

  const dominant = status?.dominant_pollutant || "—";
  setText("primaryPollutant", dominant);
  setText("primaryPollutantNote", "General awareness only (not medical advice).");
}

/* -----------------------------
   6) Render: location + map
-------------------------------- */

let miniMapInstance = null;
let miniMapMarker = null;

function renderLocationSection(location) {
  const labelEl = document.getElementById("locationLabel");
  const noteEl = document.getElementById("locationNote");
  const mapLink = document.getElementById("viewOnMap");
  const mapEl = document.getElementById("miniMap");
  const actionLink = document.getElementById("locationActionLink");

  if (!location) {
    if (labelEl) labelEl.textContent = "Not set";
    if (noteEl) noteEl.textContent = "Choose a location to see current air quality.";
    if (mapLink) {
      mapLink.href = "/location";
      mapLink.textContent = "Set location";
    }
    if (actionLink) actionLink.textContent = "Set location";
    if (mapEl) mapEl.style.display = "none";
    return;
  }

  if (labelEl) labelEl.textContent = location.label;
  if (noteEl) noteEl.textContent = "Current area";

  const lat = Number(location.latitude);
  const lon = Number(location.longitude);

  if (mapLink) {
    mapLink.href = buildGoogleMapsLink(lat, lon);
    mapLink.textContent = "View on map";
  }
  if (actionLink) actionLink.textContent = "Update location";

  if (mapEl) mapEl.style.display = "block";

  if (window.L && mapEl && !Number.isNaN(lat) && !Number.isNaN(lon)) {
    renderMiniMap(lat, lon);
  }
}

function renderMiniMap(lat, lon) {
  const containerId = "miniMap";

  if (miniMapInstance) {
    miniMapInstance.setView([lat, lon], 11);
    if (miniMapMarker) miniMapMarker.setLatLng([lat, lon]);
    return;
  }

  miniMapInstance = L.map(containerId, {
    zoomControl: false,
    attributionControl: true,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false,
  }).setView([lat, lon], 11);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
  }).addTo(miniMapInstance);

  miniMapMarker = L.marker([lat, lon]).addTo(miniMapInstance);
}
