(() => {
  const API_BASE = "/api";
  const TOKEN_KEY = "airaware_token"; 

  const $ = (id) => document.getElementById(id);

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  async function apiFetch(path, options = {}) {
    const token = getToken();
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");

    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    let data = null;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg = data?.error || data?.message || `Request failed (${res.status})`;
      throw new Error(msg);
    }

    return data;
  }

  function fmtNumber(v) {
    if (v === null || v === undefined) return "—";
    const n = Number(v);
    if (Number.isNaN(n)) return "—";
    return n.toFixed(0);
  }

  function fmtDateTime(dt) {
    if (!dt) return "—";
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  }

  // OpenWeather AQI mapping
  function aqiLabel(aqi) {
    switch (aqi) {
      case 1: return "Good";
      case 2: return "Fair";
      case 3: return "Moderate";
      case 4: return "Poor";
      case 5: return "Very Poor";
      default: return "—";
    }
  }

  // --- Leaflet map ---
  let map = null;
  let marker = null;

  function renderMiniMap(lat, lon) {
    const mapEl = $("miniMap");
    if (!mapEl || !window.L) return;
    if (lat == null || lon == null) return;

    const pos = [Number(lat), Number(lon)];

    if (!map) {
      map = L.map("miniMap", {
        zoomControl: false,
        attributionControl: true,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        tap: false,
      }).setView(pos, 11);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      marker = L.marker(pos).addTo(map);
      return;
    }

    map.setView(pos, 11);
    if (marker) marker.setLatLng(pos);
  }

  function setText(id, text) {
    const el = $(id);
    if (el) el.textContent = text;
  }

  function setHref(id, href) {
    const el = $(id);
    if (el) el.href = href;
  }

  function applyHomepage(payload) {
    

    // 1) If no location yet
    if (!payload?.location) {
      setText("locationLabel", "Not set");
      setHref("viewOnMap", "https://www.google.com/maps");
      setText("primaryPollutant", "—");
      setText("primaryPollutantNote", "Set location to calculate");
      setText("snapshotLabel", "Set location");
      setText("snapshotDesc", "Add a location to personalise your snapshot.");
      return;
    }

    // 2) Location + map
    const loc = payload.location;
    setText("locationLabel", loc.label || "—");

    if (loc.latitude != null && loc.longitude != null) {
      setHref("viewOnMap", `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`);
      renderMiniMap(loc.latitude, loc.longitude);
    }

    // 3) Sensitivity (user table)
    const s = payload?.user?.sensitivity_level;
    if (s) setText("sensitivityValue", s.charAt(0).toUpperCase() + s.slice(1));

    // 4) Primary pollutant
    const primary = payload?.status?.dominant_pollutant || "Unknown";
    setText("primaryPollutant", primary);

    if (payload?.status?.explanation) {
      setText("primaryPollutantNote", payload.status.explanation);
    }

    // 5) Pollutant badges + updated time (latest reading)
    const current = payload.current;
    const p = current?.pollutants || {};

    setText("b_pm25", `PM2.5: ${fmtNumber(p.pm25)}`);
    setText("b_pm10", `PM10: ${fmtNumber(p.pm10)}`);
    setText("b_no2",  `NO₂: ${fmtNumber(p.no2)}`);
    setText("b_o3",   `O₃: ${fmtNumber(p.o3)}`);
    setText("b_so2",  `SO₂: ${fmtNumber(p.so2)}`);
    setText("b_co",   `CO: ${fmtNumber(p.co)}`);
    setText("b_updated", `Updated: ${fmtDateTime(current?.observed_at)}`);

    // 6) Snapshot label
    // Prefer AQI label (from current), fallback to risk_level (from status)
    const label = aqiLabel(current?.aqi);
    if (label !== "—") {
      setText("snapshotLabel", label);
      setText("snapshotDesc", "Based on the latest air quality reading for your area.");
    } else if (payload?.status?.risk_level) {
      setText("snapshotLabel", payload.status.risk_level);
      setText("snapshotDesc", "Based on your threshold settings.");
    }
  }

  async function bootstrap() {
    const token = getToken();
    if (!token) {
      setText("snapshotLabel", "Please log in");
      setText("snapshotDesc", "Log in to load your personalised air insights.");
      return;
    }

    try {
      // A) Load whatever is already stored
      const payload = await apiFetch("/dashboard", { method: "GET" });
      applyHomepage(payload);

      // B) Refresh to fetch latest from OpenWeather + store in DB, then re-render
      const refreshed = await apiFetch("/dashboard/refresh", { method: "POST" });
      applyHomepage(refreshed);

    } catch (err) {
      console.error(err);
      setText("snapshotLabel", "Couldn’t load data");
      setText("snapshotDesc", err.message || "Please try again.");
    }
  }

  document.addEventListener("DOMContentLoaded", bootstrap);
})();
