/*
  What this file does (high level):
  1) Waits for the page HTML to load
  2) Calls backend APIs to get dashboard data (current AQI, pollutants, alerts, recommendations)
  3) Renders that data into the page
  4) Loads saved locations and lets the user switch location
  5) Lets the user refresh the data manually
*/

document.addEventListener("DOMContentLoaded", () => {
  /* -----------------------------
     1) Constants (API routes + DOM elements)
  -------------------------------- */

  const API = {
    dashboard: "/api/dashboard",
    refresh: "/api/dashboard/refresh",
    locationHistory: "/api/location/history",
    locationSelect: "/api/location/select",
  };

  // Cache (store) DOM elements we need to update often.
  // This avoids repeatedly calling document.getElementById.
  const els = {
    riskText: document.getElementById("riskText"),
    activeSearchName: document.getElementById("activeSearchName"),
    savedSearches: document.getElementById("savedSearches"),
    recentAlerts: document.getElementById("recentAlerts"),

    locationName: document.getElementById("locationName"),
    currentDateTime: document.getElementById("currentDateTime"),
    overallAQ: document.getElementById("overallAQ"),

    recommendations: document.getElementById("recommendations"),
    refreshBtn: document.getElementById("refreshBtn"),

    pollutants: {
      pm25: { value: document.getElementById("pm25Value"), status: document.getElementById("pm25Status") },
      pm10: { value: document.getElementById("pm10Value"), status: document.getElementById("pm10Status") },
      so2:  { value: document.getElementById("so2Value"),  status: document.getElementById("so2Status")  },
      no2:  { value: document.getElementById("no2Value"),  status: document.getElementById("no2Status")  },
      o3:   { value: document.getElementById("o3Value"),   status: document.getElementById("o3Status")   },
      co:   { value: document.getElementById("coValue"),   status: document.getElementById("coStatus")   },
    },
  };

  /*
    OpenWeather "band" tables:
    We convert pollutant concentration values into an index number (1..5).
    That index is then converted into a label: Good, Fair, Moderate, Poor, Very Poor.

    Each pollutant key (pm25, pm10, etc.) maps to an array of ranges (bands).
    If a value falls into band idx 3, it means overall rating "Moderate" for that pollutant.
  */
  const POLLUTANT_BANDS = {
    so2:  [
      { idx: 1, min: 0,     max: 20 },
      { idx: 2, min: 20,    max: 80 },
      { idx: 3, min: 80,    max: 250 },
      { idx: 4, min: 250,   max: 350 },
      { idx: 5, min: 350,   max: Infinity },
    ],
    no2:  [
      { idx: 1, min: 0,     max: 40 },
      { idx: 2, min: 40,    max: 70 },
      { idx: 3, min: 70,    max: 150 },
      { idx: 4, min: 150,   max: 200 },
      { idx: 5, min: 200,   max: Infinity },
    ],
    pm10: [
      { idx: 1, min: 0,     max: 20 },
      { idx: 2, min: 20,    max: 50 },
      { idx: 3, min: 50,    max: 100 },
      { idx: 4, min: 100,   max: 200 },
      { idx: 5, min: 200,   max: Infinity },
    ],
    pm25: [
      { idx: 1, min: 0,     max: 10 },
      { idx: 2, min: 10,    max: 25 },
      { idx: 3, min: 25,    max: 50 },
      { idx: 4, min: 50,    max: 75 },
      { idx: 5, min: 75,    max: Infinity },
    ],
    o3:   [
      { idx: 1, min: 0,     max: 60 },
      { idx: 2, min: 60,    max: 100 },
      { idx: 3, min: 100,   max: 140 },
      { idx: 4, min: 140,   max: 180 },
      { idx: 5, min: 180,   max: Infinity },
    ],
    co:   [
      { idx: 1, min: 0,     max: 4400 },
      { idx: 2, min: 4400,  max: 9400 },
      { idx: 3, min: 9400,  max: 12400 },
      { idx: 4, min: 12400, max: 15400 },
      { idx: 5, min: 15400, max: Infinity },
    ],
  };

  /* -----------------------------
     2) State (data we keep in memory)
  -------------------------------- */

  // History list for saved locations (from /api/location/history)
  let locationsHistory = [];

  // The currently active location (from dashboard payload)
  let activeLocation = null;

  /* -----------------------------
     3) Small helper functions (keep logic simple + reusable)
  -------------------------------- */

  // Reads token from localStorage. If missing, redirect to login.
  // Returning null makes it obvious that we cannot continue with API calls.
  function getTokenOrRedirect() {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.replace("/login");
      return null;
    }
    return token;
  }

  /*
    apiFetch:
    - Adds auth header automatically
    - Parses JSON response
    - Throws a helpful error message when the response is not OK
  */
  async function apiFetch(url, options = {}) {
    const token = getTokenOrRedirect();
    if (!token) return null;

    const res = await fetch(url, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: options.body,
    });

    // Some backends might return non-JSON if there's an unexpected error.
    // So we guard with catch and default to {}.
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Prefer server-provided message if available, otherwise build one.
      throw new Error(data.error || data.message || `Request failed (${res.status})`);
    }

    return data;
  }

  // Safe text setter: only sets if element exists.
  function setText(el, text) {
    if (el) el.textContent = text;
  }

  // Formats "now" in a UK-friendly format.
  function formatNowUK() {
    return new Date().toLocaleString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Converts AQI number to human-friendly label.
  function aqiName(n) {
    const map = { 1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor" };
    return map[n] || "Unknown";
  }

  /*
    pollutantIndex:
    Given a pollutant key (e.g. "pm25") and a value (e.g. 37.2),
    return the index 1..5 based on POLLUTANT_BANDS.

    Returns null if:
    - value is missing
    - value is not a number
    - pollutant key is unknown
  */
  function pollutantIndex(pollutantKey, value) {
    if (value === null || value === undefined) return null;

    const n = Number(value);
    if (Number.isNaN(n)) return null;

    const bands = POLLUTANT_BANDS[pollutantKey];
    if (!bands) return null;

    // Find the first band range that contains the value.
    // Infinity band covers "anything above the top".
    const band = bands.find((b) => n >= b.min && (n < b.max || b.max === Infinity));
    return band ? band.idx : null;
  }

  /*
    round:
    Display helper for pollutant values.
    - If value missing => "—"
    - If >= 100 => no decimals (easier to read)
    - Else => 1 decimal place
  */
  function round(x) {
    if (x === null || x === undefined) return "—";
    const n = Number(x);
    if (Number.isNaN(n)) return "—";
    return n >= 100 ? String(Math.round(n)) : String(Math.round(n * 10) / 10);
  }

  // Used to avoid showing the currently active location inside the "saved searches" list.
  function sameLatLon(a, b) {
    return Number(a?.latitude) === Number(b?.latitude) && Number(a?.longitude) === Number(b?.longitude);
  }

  /* -----------------------------
     4) Render functions (each one updates one part of the UI)
        Keep render functions "pure-ish":
        - Read from payload
        - Update DOM
        - Avoid calling APIs inside render
  -------------------------------- */

  function renderHeader(payload) {
    // Save active location so other parts can access it (like saved searches filter).
    activeLocation = payload?.location || null;

    const label = activeLocation?.label || "—";
    setText(els.locationName, label);
    setText(els.activeSearchName, label);

    const aqi = payload?.current?.aqi ?? null;
    setText(els.overallAQ, aqiName(aqi));

    // Risk summary line. Comes from backend "status".
    if (els.riskText) {
      const s = payload?.status;
      els.riskText.textContent = s
        ? `${s.risk_level} Risk | Dominant pollutant: ${s.dominant_pollutant}, based on your alert threshold`
        : "No risk assessment available yet.";
    }
  }

  function renderPollutants(payload) {
    const p = payload?.current?.pollutants;

    // If pollutants are missing, reset all rows to "—"
    if (!p) {
      Object.values(els.pollutants).forEach(({ value, status }) => {
        setText(value, "—");
        setText(status, "—");
      });
      return;
    }

    // 1) Show the numeric values
    setText(els.pollutants.pm25.value, round(p.pm25));
    setText(els.pollutants.pm10.value, round(p.pm10));
    setText(els.pollutants.so2.value,  round(p.so2));
    setText(els.pollutants.no2.value,  round(p.no2));
    setText(els.pollutants.o3.value,   round(p.o3));
    setText(els.pollutants.co.value,   round(p.co));

    // 2) Convert each pollutant numeric value into a 1..5 band, then to a label
    setText(els.pollutants.pm25.status, aqiName(pollutantIndex("pm25", p.pm25)));
    setText(els.pollutants.pm10.status, aqiName(pollutantIndex("pm10", p.pm10)));
    setText(els.pollutants.so2.status,  aqiName(pollutantIndex("so2",  p.so2)));
    setText(els.pollutants.no2.status,  aqiName(pollutantIndex("no2",  p.no2)));
    setText(els.pollutants.o3.status,   aqiName(pollutantIndex("o3",   p.o3)));
    setText(els.pollutants.co.status,   aqiName(pollutantIndex("co",   p.co)));
  }

  function renderRecommendations(payload) {
    if (!els.recommendations) return;

    const recs = payload?.recommendations || [];

    if (!recs.length) {
      els.recommendations.innerHTML = `
        <div class="recoTitle">Recommendations</div>
        <div class="recoLine">No recommendations available yet.</div>
      `;
      return;
    }

    // Keep only 5 to avoid overcrowding the UI
    els.recommendations.innerHTML = `
      <div class="recoTitle">Recommendations</div>
      ${recs.slice(0, 5).map((r) => `<div class="recoLine">${r.text}</div>`).join("")}
    `;
  }

  function renderAlerts(payload) {
    if (!els.recentAlerts) return;

    const alerts = payload?.alerts || [];
    const trigger = payload?.thresholds?.effective_trigger_aqi ?? 3;

    const aqi = payload?.current?.aqi ?? null;
    const observedAt = payload?.current?.observed_at ?? null;

    const lines = [];

    // Add a "current AQI vs trigger" line if we have enough data
    if (aqi && observedAt) {
      const t = new Date(observedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      const msg =
        aqi >= trigger
          ? `AQI (${aqiName(aqi)}) is above your alert threshold (${trigger}).`
          : `AQI (${aqiName(aqi)}) is below your alert threshold (${trigger}).`;
      lines.push({ t, msg });
    }

    // Add up to 3 recent alert messages from the backend
    alerts.slice(0, 3).forEach((a) => {
      const t = new Date(a.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      lines.push({ t, msg: `${a.risk_level} risk: ${a.explanation}` });
    });

    if (!lines.length) {
      els.recentAlerts.innerHTML = `<div class="aa-alert-line"><span>—</span><span>No alerts yet</span></div>`;
      return;
    }

    // Render lines as simple time + message rows
    els.recentAlerts.innerHTML = lines
      .map((x) => `<div class="aa-alert-line"><span>${x.t}</span><span>— ${x.msg}</span></div>`)
      .join("");
  }

  /* -----------------------------
     5) Data loading functions (API calls only)
  -------------------------------- */

  async function loadLocationHistory() {
    const data = await apiFetch(API.locationHistory);
    locationsHistory = data?.locations || [];
  }

  /*
    Renders buttons for saved locations (excluding the currently active location).
    Clicking a button:
    1) calls PATCH /api/location/select
    2) then reloads dashboard data
  */
  function renderSavedSearches() {
    if (!els.savedSearches) return;

    // Clear old list (important when re-rendering after location switch)
    els.savedSearches.innerHTML = "";

    // Filter out current active location
    const list = locationsHistory.filter((l) => !sameLatLon(l, activeLocation));

    if (!list.length) {
      els.savedSearches.innerHTML = `<div class="aa-alert-line"><span>—</span><span>No other saved locations</span></div>`;
      return;
    }

    list.forEach((loc) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "aa-btn-ghost";
      btn.textContent = loc.label;

      btn.addEventListener("click", async () => {
        try {
          // Tell backend to switch our active location
          await apiFetch(API.locationSelect, {
            method: "PATCH",
            body: JSON.stringify({ locationId: loc.id }),
          });

          // After switching, refresh UI from the "real" dashboard data
          await loadDashboard();
        } catch (err) {
          alert(err.message);
        }
      });

      els.savedSearches.appendChild(btn);
    });
  }

  /*
    loadDashboard:
    - GET dashboard data
    - If no location exists yet, send the user to the location page
    - Render all UI pieces
    - Load saved locations and render them
  */
  async function loadDashboard() {
    const payload = await apiFetch(API.dashboard);

    // If backend says there's no active location, user must choose one first
    if (!payload?.location) {
      window.location.replace("/location");
      return;
    }

    renderHeader(payload);
    renderPollutants(payload);
    renderRecommendations(payload);
    renderAlerts(payload);

    await loadLocationHistory();
    renderSavedSearches();
  }

  /*
    refreshDashboard:
    - POST refresh endpoint (backend likely hits OpenWeather again)
    - If backend says we need location, redirect
    - Render all UI pieces and refresh saved searches
  */
  async function refreshDashboard() {
    const payload = await apiFetch(API.refresh, { method: "POST" });

    if (payload?.state?.needs_location) {
      window.location.replace("/location");
      return;
    }

    renderHeader(payload);
    renderPollutants(payload);
    renderRecommendations(payload);
    renderAlerts(payload);

    await loadLocationHistory();
    renderSavedSearches();
  }

  /* -----------------------------
     6) Event listeners (user interactions)
  -------------------------------- */

  // Refresh button: disable during refresh to avoid duplicate requests
  els.refreshBtn?.addEventListener("click", async () => {
    try {
      els.refreshBtn.disabled = true;
      await refreshDashboard();
    } catch (err) {
      alert(err.message);
    } finally {
      els.refreshBtn.disabled = false;
    }
  });

  /* -----------------------------
     7) App start (init)
  -------------------------------- */

  (async function init() {
    try {
      // Keep the header clock updated
      if (els.currentDateTime) {
        els.currentDateTime.textContent = formatNowUK();
        setInterval(() => {
          els.currentDateTime.textContent = formatNowUK();
        }, 30_000);
      }

      // First load when the page opens
      await loadDashboard();
    } catch (err) {
      console.error(err);
      alert(err.message || "Dashboard failed to load.");
    }
  })();
});
