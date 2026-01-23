document.addEventListener("DOMContentLoaded", () => {
  const API = {
    dashboard: "/api/dashboard",
    refresh: "/api/dashboard/refresh",
    locationHistory: "/api/location/history",
  };

  // Navbar / header
  const riskText = document.getElementById("riskText");
  const activeSearchName = document.getElementById("activeSearchName");
  const savedSearches = document.getElementById("savedSearches");

  // Info pill
  const locationName = document.getElementById("locationName");
  const currentDateTime = document.getElementById("currentDateTime");
  const overallAQ = document.getElementById("overallAQ");

  // Pollutants
  const pollutantEls = {
    pm25: { value: document.getElementById("pm25Value"), status: document.getElementById("pm25Status") },
    pm10: { value: document.getElementById("pm10Value"), status: document.getElementById("pm10Status") },
    so2:  { value: document.getElementById("so2Value"),  status: document.getElementById("so2Status")  },
    no2:  { value: document.getElementById("no2Value"),  status: document.getElementById("no2Status")  },
    o3:   { value: document.getElementById("o3Value"),   status: document.getElementById("o3Status")   },
    co:   { value: document.getElementById("coValue"),   status: document.getElementById("coStatus")   },
  };

  const recommendationsEl = document.getElementById("recommendations");
  const recentAlertsEl = document.getElementById("recentAlerts");
  const refreshBtn = document.getElementById("refreshBtn");

  let locationsHistory = [];

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
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
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

  function startClock() {
    if (!currentDateTime) return;
    currentDateTime.textContent = formatNowUK();
    setInterval(() => {
      currentDateTime.textContent = formatNowUK();
    }, 30_000);
  }

  function aqiName(n) {
    const map = { 1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor" };
    return map[n] || "Unknown";
  }

  function round(x) {
    if (x === null || x === undefined) return "—";
    const n = Number(x);
    if (Number.isNaN(n)) return "—";
    return n >= 100 ? String(Math.round(n)) : String(Math.round(n * 10) / 10);
  }

  function setText(el, text) {
    if (el) el.textContent = text;
  }

  function renderHeader(payload) {
    const locLabel = payload?.location?.label || "—";
    setText(locationName, locLabel);
    setText(activeSearchName, locLabel);

    const aqiNum = payload?.current?.aqi ?? payload?.status?.aqi_label ?? null;
    setText(overallAQ, aqiName(aqiNum));

    const status = payload?.status;
    if (riskText) {
      if (!status) {
        riskText.textContent = "No recent risk assessment available yet.";
      } else {
        riskText.textContent = `${status.risk_level} Risk | Dominant pollutant: ${status.dominant_pollutant}, based on your alert threshold`;
      }
    }
  }

  function renderPollutants(payload) {
    const p = payload?.current?.pollutants;
    if (!p) return;

    setText(pollutantEls.pm25.value, round(p.pm25));
    setText(pollutantEls.pm10.value, round(p.pm10));
    setText(pollutantEls.so2.value,  round(p.so2));
    setText(pollutantEls.no2.value,  round(p.no2));
    setText(pollutantEls.o3.value,   round(p.o3));
    setText(pollutantEls.co.value,   round(p.co));

    // You can later compute pollutant statuses; for now keep simple
    Object.values(pollutantEls).forEach(({ status }) => setText(status, "—"));
  }

  function renderRecommendations(payload) {
    if (!recommendationsEl) return;

    const recs = payload?.recommendations || [];
    // Keep your existing header line in HTML, then fill below it
    const lines = recs.length
      ? recs.map(r => `<div class="recoLine">${r.text}</div>`).join("")
      : `<div class="recoLine">No recommendations available yet.</div>`;

    recommendationsEl.innerHTML = `
      <div class="recoTitle">Recommendations</div>
      ${lines}
    `;
  }

  function renderAlerts(payload) {
    if (!recentAlertsEl) return;
    const alerts = payload?.alerts || [];

    if (!alerts.length) {
      recentAlertsEl.innerHTML = `<div class="aa-alert-line"><span>—</span><span>No alerts yet</span></div>`;
      return;
    }

    recentAlertsEl.innerHTML = alerts
      .slice(0, 5)
      .map(a => {
        const t = new Date(a.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        return `<div class="aa-alert-line"><span>${t}</span><span>— ${a.risk_level}</span></div>`;
      })
      .join("");
  }

  async function loadLocationHistory() {
    const data = await apiFetch(API.locationHistory);
    locationsHistory = data?.locations || [];

    if (!savedSearches) return;

    savedSearches.innerHTML = "";
    locationsHistory.forEach(loc => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "aa-btn-ghost";
      btn.textContent = loc.label;

      // IMPORTANT: right now your dashboard backend always uses the user's "home" location.
      // Clicking these can't change dashboard data unless we add a "select home" endpoint.
      btn.addEventListener("click", () => {
        alert("To switch dashboard location, we need an endpoint to set this as your active (home) location.");
      });

      savedSearches.appendChild(btn);
    });
  }

  async function loadDashboard() {
    const payload = await apiFetch(API.dashboard);

    // If user hasn't set location, backend tells you location=null
    if (!payload?.location) {
      window.location.replace("/location");
      return;
    }

    renderHeader(payload);
    renderPollutants(payload);
    renderRecommendations(payload);
    renderAlerts(payload);
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
  }

  refreshBtn?.addEventListener("click", async () => {
    try {
      refreshBtn.disabled = true;
      await refreshDashboard();
    } catch (err) {
      alert(err.message);
    } finally {
      refreshBtn.disabled = false;
    }
  });

  (async function init() {
    try {
      startClock();
      await loadLocationHistory();
      await loadDashboard();
    } catch (err) {
      console.error(err);
      alert(err.message || "Dashboard failed to load.");
    }
  })();
});
