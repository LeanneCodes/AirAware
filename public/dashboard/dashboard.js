document.addEventListener("DOMContentLoaded", () => {
  const API = {
    dashboard: "/api/dashboard",
    refresh: "/api/dashboard/refresh",
    locationHistory: "/api/location/history",
    locationSelect: "/api/location/select",
  };

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

  // OpenWeather table bands (μg/m3) → index 1..5
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

  let locationsHistory = [];
  let activeLocation = null;

  function getTokenOrRedirect() {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.replace("/login");
      return null;
    }
    return token;
  }

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

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
    return data;
  }

  function setText(el, text) {
    if (el) el.textContent = text;
  }

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

  function aqiName(n) {
    const map = { 1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor" };
    return map[n] || "Unknown";
  }

  function pollutantIndex(pollutantKey, value) {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    if (Number.isNaN(n)) return null;

    const bands = POLLUTANT_BANDS[pollutantKey];
    if (!bands) return null;

    const band = bands.find(b => (n >= b.min) && (n < b.max || b.max === Infinity));
    return band ? band.idx : null;
  }

  function round(x) {
    if (x === null || x === undefined) return "—";
    const n = Number(x);
    if (Number.isNaN(n)) return "—";
    return n >= 100 ? String(Math.round(n)) : String(Math.round(n * 10) / 10);
  }

  function sameLatLon(a, b) {
    return Number(a?.latitude) === Number(b?.latitude) && Number(a?.longitude) === Number(b?.longitude);
  }

  function renderHeader(payload) {
    activeLocation = payload?.location || null;

    const label = activeLocation?.label || "—";
    setText(els.locationName, label);
    setText(els.activeSearchName, label);

    const aqi = payload?.current?.aqi ?? null;
    setText(els.overallAQ, aqiName(aqi));

    if (els.riskText) {
      const s = payload?.status;
      els.riskText.textContent = s
        ? `${s.risk_level} Risk | Dominant pollutant: ${s.dominant_pollutant}, based on your alert threshold`
        : "No risk assessment available yet.";
    }
  }

  function renderPollutants(payload) {
    const current = payload?.current;
    const p = current?.pollutants;

    if (!p) {
      Object.values(els.pollutants).forEach(({ value, status }) => {
        setText(value, "—");
        setText(status, "—");
      });
      return;
    }

    setText(els.pollutants.pm25.value, round(p.pm25));
    setText(els.pollutants.pm10.value, round(p.pm10));
    setText(els.pollutants.so2.value,  round(p.so2));
    setText(els.pollutants.no2.value,  round(p.no2));
    setText(els.pollutants.o3.value,   round(p.o3));
    setText(els.pollutants.co.value,   round(p.co));

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

    els.recommendations.innerHTML = `
      <div class="recoTitle">Recommendations</div>
      ${recs.slice(0, 5).map(r => `<div class="recoLine">${r.text}</div>`).join("")}
    `;
  }

  function renderAlerts(payload) {
    if (!els.recentAlerts) return;

    const alerts = payload?.alerts || [];
    const trigger = payload?.thresholds?.effective_trigger_aqi ?? 3;
    const aqi = payload?.current?.aqi ?? null;
    const observedAt = payload?.current?.observed_at ?? null;

    const lines = [];

    if (aqi && observedAt) {
      const t = new Date(observedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      const msg =
        aqi >= trigger
          ? `AQI (${aqiName(aqi)}) is above your alert threshold (${trigger}).`
          : `AQI (${aqiName(aqi)}) is below your alert threshold (${trigger}).`;
      lines.push({ t, msg });
    }

    alerts.slice(0, 3).forEach((a) => {
      const t = new Date(a.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      lines.push({ t, msg: `${a.risk_level} risk: ${a.explanation}` });
    });

    if (!lines.length) {
      els.recentAlerts.innerHTML = `<div class="aa-alert-line"><span>—</span><span>No alerts yet</span></div>`;
      return;
    }

    els.recentAlerts.innerHTML = lines
      .map((x) => `<div class="aa-alert-line"><span>${x.t}</span><span>— ${x.msg}</span></div>`)
      .join("");
  }

  async function loadLocationHistory() {
    const data = await apiFetch(API.locationHistory);
    locationsHistory = data?.locations || [];
  }

  function renderSavedSearches() {
    if (!els.savedSearches) return;
    els.savedSearches.innerHTML = "";

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
          await apiFetch(API.locationSelect, {
            method: "PATCH",
            body: JSON.stringify({ locationId: loc.id }),
          });

          // Reload dashboard after switching active location
          await loadDashboard();
        } catch (err) {
          alert(err.message);
        }
      });

      els.savedSearches.appendChild(btn);
    });
  }

  async function loadDashboard() {
    const payload = await apiFetch(API.dashboard);

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

  (async function init() {
    try {
      if (els.currentDateTime) {
        els.currentDateTime.textContent = formatNowUK();
        setInterval(() => (els.currentDateTime.textContent = formatNowUK()), 30_000);
      }

      await loadDashboard();
    } catch (err) {
      console.error(err);
      alert(err.message || "Dashboard failed to load.");
    }
  })();
});
