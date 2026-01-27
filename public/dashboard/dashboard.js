/*
  What this file does (high level):
  1) Waits for the page HTML to load
  2) Calls backend APIs to get dashboard data (current AQI, pollutants, alerts, recommendations)
  3) Renders that data into the page
  4) Loads saved locations and lets the user switch location
  5) Lets the user refresh the data manually
*/

document.addEventListener("DOMContentLoaded", () => {
  loadNavbarUser();
  /* -----------------------------
     1) Constants (API routes + DOM elements)
  -------------------------------- */
  const API = {
    dashboard: `${window.API_BASE}/api/dashboard`,
    refresh: `${window.API_BASE}/api/dashboard/refresh`,
    locationHistory: `${window.API_BASE}/api/location/history`,
    locationSelect: `${window.API_BASE}/api/location/select`,
    // IMPORTANT: delete is now DELETE /api/location/:id
    locationDeleteBase: `${window.API_BASE}/api/location`,
  };

  const els = {
    riskText: document.getElementById("riskText"),
    activeSearchName: document.getElementById("activeSearchName"),
    savedSearches: document.getElementById("savedSearches"),
    recentAlerts: document.getElementById("recentAlerts"),

    locationName: document.getElementById("locationName"),
    currentDateTime: document.getElementById("currentDateTime"),
    overallAQ: document.getElementById("overallAQ"),

    aqiMeterFill: document.getElementById("aqMeterFill"),

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

    const confirmEls = {
    modal: document.getElementById("confirmDeleteModal"),
    text: document.getElementById("confirmDeleteText"),
    btn: document.getElementById("confirmDeleteBtn"),
  };

  function confirmDelete(label) {
    return new Promise((resolve) => {
      // Fallback if Bootstrap modal not available for any reason
      if (!window.bootstrap?.Modal || !confirmEls.modal || !confirmEls.btn) {
        resolve(window.confirm(`Remove "${label}" from saved searches?`));
        return;
      }

      if (confirmEls.text) {
        confirmEls.text.textContent = `Are you sure you want to remove "${label}" from saved searches?`;
      }

      const modal = window.bootstrap.Modal.getOrCreateInstance(confirmEls.modal);

      const onConfirm = () => {
        cleanup();
        modal.hide();
        resolve(true);
      };

      const onHide = () => {
        cleanup();
        resolve(false);
      };

      function cleanup() {
        confirmEls.btn.removeEventListener("click", onConfirm);
        confirmEls.modal.removeEventListener("hidden.bs.modal", onHide);
      }

      confirmEls.btn.addEventListener("click", onConfirm);
      confirmEls.modal.addEventListener("hidden.bs.modal", onHide);

      modal.show();
    });
  }


  /* -----------------------------
     Pollutant bands
  -------------------------------- */

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
     2) State
  -------------------------------- */

  let locationsHistory = [];
  let activeLocation = null;

  /* -----------------------------
     3) Helpers
  -------------------------------- */

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

    if (!res.ok) {
      throw new Error(data.error || data.message || `Request failed (${res.status})`);
    }

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

function sensitivityLabelFromTriggerIdx(triggerIdx) {
  const map = {
    2: "Very sensitive",
    3: "Sensitive",
    4: "Moderately sensitive",
    5: "Not sensitive",
  };
  return map[triggerIdx] || "Moderately sensitive";
}

function getSensitivityLabel(payload) {
  const uiValue = localStorage.getItem("sensitivity_ui");
  if (uiValue) return uiLabelFromUiValue(uiValue);

  const triggerIdx = payload?.thresholds?.effective_trigger_aqi ?? null;
  if (triggerIdx) return sensitivityLabelFromTriggerIdx(triggerIdx);

  return "Moderately sensitive";
}

  function triggerToSensitivityLabel(triggerIdx) {
  const map = {
    2: "Very sensitive",
    3: "Sensitive",
    4: "Moderately sensitive",
    5: "Not sensitive",
  };
  return map[triggerIdx] || "Moderately sensitive";
}

function dominantTip(dominantKey) {
  switch (dominantKey) {
    case "no2":
    case "co":
      return [
        "Traffic-related pollutants can be higher near busy roads.",
        "Choose quieter streets or green spaces, ventilate indoors outside rush hour.",
      ];
    case "pm25":
    case "pm10":
      return [
        "Fine particles can come from smoke, dust, and traffic.",
        "Avoid smoky areas and heavy-dust routes, check air quality again later.",
      ];
    case "o3":
      return [
        "Ozone can be higher on warm, sunny afternoons.",
        "If possible, plan outdoor activity for morning or evening.",
      ];
    case "so2":
      return [
        "SO₂ can rise near industry or dense traffic in some areas.",
        "Avoid lingering near strong fumes, consider a quieter route.",
      ];
    default:
      return [];
  }
}

function buildRecoList({ sensitivityLabel, alertActive, currentAqiName }) {
  const base = {
    "Not sensitive": alertActive
      ? [
          `Air quality is ${currentAqiName}. Consider reducing prolonged time near traffic.`,
          "If exercising outdoors, choose green spaces away from busy roads.",
        ]
      : [
          "Outdoor activities are generally fine.",
          "If exercising outdoors, prefer greener routes away from main roads.",
        ],

    "Slightly sensitive": alertActive
      ? [
          `Air quality is ${currentAqiName}. Consider shortening outdoor activity near traffic.`,
          "If needed, switch to an indoor option for comfort.",
        ]
      : [
          "Outdoor activities are usually comfortable.",
          "Avoid lingering near congested roads or idling vehicles.",
        ],

    "Moderately sensitive": alertActive
      ? [
          `Air quality is ${currentAqiName}. Reduce time outdoors, especially near busy roads.`,
          "Consider rescheduling outdoor exercise to later in the day.",
          "Keep windows closed during peak traffic hours if possible.",
        ]
      : [
          "Plan outdoor activities away from main roads where possible.",
          "Ventilate indoor spaces during quieter traffic periods.",
        ],

    "Sensitive": alertActive
      ? [
          `Air quality is ${currentAqiName}. Limit outdoor activity near busy roads.`,
          "Prefer indoor activities where possible.",
          "Ventilate indoors outside peak traffic hours.",
        ]
      : [
          "Be mindful of prolonged outdoor activity near traffic.",
          "Choose quieter routes and green spaces when you can.",
        ],

    "Very sensitive": alertActive
      ? [
          `Air quality is ${currentAqiName}. Avoid outdoor activity near roads if possible.`,
          "Stay indoors during peak pollution times where practical.",
          "Ventilate rooms later when outdoor levels may be lower.",
        ]
      : [
          "Plan routes away from busy roads where possible.",
          "Check air quality updates throughout the day.",
        ],
  };

  return base[sensitivityLabel] || base["Moderately sensitive"];
}

function safeLink(url, text) {
  return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
}


  function pollutantIndex(pollutantKey, value) {
    if (value === null || value === undefined) return null;

    const n = Number(value);
    if (Number.isNaN(n)) return null;

    const bands = POLLUTANT_BANDS[pollutantKey];
    if (!bands) return null;

    const band = bands.find((b) => n >= b.min && (n < b.max || b.max === Infinity));
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



  /* -----------------------------
     3.5) Indicator helpers
  -------------------------------- */

  function statusClassFromIdx(aqiIdx) {
    switch (aqiIdx) {
      case 1: return "is-good";
      case 2: return "is-fair";
      case 3: return "is-moderate";
      case 4: return "is-poor";
      case 5: return "is-verypoor";
      default: return "";
    }
  }

  function setOverallIndicator(aqiIdx) {
    if (!els.aqiMeterFill) return;

    const config = {
      1: { width: "100%",  colour: "#2f9e44" },
      2: { width: "80%",  colour: "#66a80f" },
      3: { width: "60%",  colour: "#fab005" },
      4: { width: "40%",  colour: "#e03131" },
      5: { width: "20%", colour: "#6a040f" },
    };

    const c = config[aqiIdx];
    if (!c) return;

    els.aqiMeterFill.style.width = c.width;
    els.aqiMeterFill.style.backgroundColor = c.colour;
  }

  function setCardStatusClass(pollutantKey, aqiIdx) {
    const card = document.querySelector(`.pollCard[data-pollutant="${pollutantKey}"]`);
    if (!card) return;

    card.classList.remove("is-good", "is-fair", "is-moderate", "is-poor", "is-verypoor");
    const cls = statusClassFromIdx(aqiIdx);
    if (cls) card.classList.add(cls);
  }

  function setDominantBadge(dominantKey) {
    document.querySelectorAll(".pollCard .dominantBadge").forEach((b) => b.remove());
    if (!dominantKey) return;

    const card = document.querySelector(`.pollCard[data-pollutant="${dominantKey}"]`);
    if (!card) return;

    const badge = document.createElement("span");
    badge.className = "dominantBadge";
    badge.textContent = "Dominant";
    card.appendChild(badge);
  }

  function normaliseDominantPollutantKey(raw) {
    if (!raw) return null;

    const keyMap = {
      "PM2.5": "pm25",
      "PM 2.5": "pm25",
      "PM₂.₅": "pm25",
      "PM10": "pm10",
      "PM 10": "pm10",
      "PM₁₀": "pm10",
      "SO2": "so2",
      "SO₂": "so2",
      "NO2": "no2",
      "NO₂": "no2",
      "O3": "o3",
      "O₃": "o3",
      "CO": "co",
    };

    return keyMap[String(raw).trim()] || null;
  }

  /* -----------------------------
     4) Render functions
  -------------------------------- */

  function renderHeader(payload) {
    activeLocation = payload?.location || null;

    const label = activeLocation?.label || "—";
    setText(els.locationName, label);
    setText(els.activeSearchName, label);

    const aqi = payload?.current?.aqi ?? null;
    setText(els.overallAQ, aqiName(aqi));
    setOverallIndicator(aqi);

    if (els.riskText) {
      const s = payload?.status;
      els.riskText.textContent = s
        ? `${s.risk_level} Risk | Dominant pollutant: ${s.dominant_pollutant}, based on your alert threshold`
        : "No risk assessment available yet.";
    }

    const dominantRaw = payload?.status?.dominant_pollutant || null;
    setDominantBadge(normaliseDominantPollutantKey(dominantRaw));
  }

  function renderPollutants(payload) {
    const p = payload?.current?.pollutants;

    if (!p) {
      Object.values(els.pollutants).forEach(({ value, status }) => {
        setText(value, "—");
        setText(status, "—");
      });
      ["pm25", "pm10", "so2", "no2", "o3", "co"].forEach((k) => setCardStatusClass(k, null));
      return;
    }

    setText(els.pollutants.pm25.value, round(p.pm25));
    setText(els.pollutants.pm10.value, round(p.pm10));
    setText(els.pollutants.so2.value,  round(p.so2));
    setText(els.pollutants.no2.value,  round(p.no2));
    setText(els.pollutants.o3.value,   round(p.o3));
    setText(els.pollutants.co.value,   round(p.co));

    const pm25Idx = pollutantIndex("pm25", p.pm25);
    const pm10Idx = pollutantIndex("pm10", p.pm10);
    const so2Idx  = pollutantIndex("so2",  p.so2);
    const no2Idx  = pollutantIndex("no2",  p.no2);
    const o3Idx   = pollutantIndex("o3",   p.o3);
    const coIdx   = pollutantIndex("co",   p.co);

    setText(els.pollutants.pm25.status, aqiName(pm25Idx));
    setText(els.pollutants.pm10.status, aqiName(pm10Idx));
    setText(els.pollutants.so2.status,  aqiName(so2Idx));
    setText(els.pollutants.no2.status,  aqiName(no2Idx));
    setText(els.pollutants.o3.status,   aqiName(o3Idx));
    setText(els.pollutants.co.status,   aqiName(coIdx));

    setCardStatusClass("pm25", pm25Idx);
    setCardStatusClass("pm10", pm10Idx);
    setCardStatusClass("so2",  so2Idx);
    setCardStatusClass("no2",  no2Idx);
    setCardStatusClass("o3",   o3Idx);
    setCardStatusClass("co",   coIdx);
  }

  function renderRecommendations(payload) {
  if (!els.recommendations) return;

  const triggerIdx = payload?.thresholds?.effective_trigger_aqi ?? 3;
  const aqi = payload?.current?.aqi ?? null;

  const currentAqiName = aqiName(aqi);
  const triggerAqiName = aqiName(triggerIdx);

  const alertActive = (aqi != null && triggerIdx != null) ? (aqi >= triggerIdx) : false;

  const sensitivityLabel = getSensitivityLabel(payload);

  const dominantRaw = payload?.status?.dominant_pollutant || null;
  const dominantKey = normaliseDominantPollutantKey(dominantRaw);

  const baseTips = buildRecoList({ sensitivityLabel, alertActive, currentAqiName });
  const domTips = dominantTip(dominantKey);

  const nhsUrl = "https://www.gov.uk/government/publications/health-effects-of-air-pollution/health-advice-for-the-daily-air-quality-index-daqi";
  const nhsLink = safeLink(nhsUrl, "DEFRA- Health advice for the Daily Air Quality Index (DAQI)");

  const title = alertActive
    ? `Alert Active`
    : `General Guidance`;

  const intro = alertActive
    ? `Air quality is <strong>${currentAqiName}</strong>, which meets your alert setting (<strong>${triggerAqiName}</strong> or worse) for <strong>${sensitivityLabel}</strong>.`
    : `Your setting is <strong>${sensitivityLabel}</strong>. Alerts start when air quality becomes <strong>${triggerAqiName}</strong> or worse.`;

  const bullets = [...baseTips, ...domTips]
    .slice(0, 6) 
    .map((t) => `<li>${t}</li>`)
    .join("");

  const footer = `
    <div class="recoFoot">
      <div class="recoSmall">
        <strong>Important:</strong> This section is for environmental awareness only and is <strong>not medical advice</strong>.
        If you feel unwell or develop symptoms, seek advice from a healthcare professional.
      </div>
      <div class="recoSmall">
        Source: ${nhsLink}
      </div>
      <div class="recoSmall">
        In an emergency, call <strong>999</strong> (UK).
      </div>
    </div>
  `;


  els.recommendations.innerHTML = `
    <div class="recoTitle ${alertActive ? "recoTitle--alert" : ""}">${title}</div>
    <div class="recoLine">${intro}</div>

    <ul class="recoList ${alertActive ? "recoList--alert" : ""}">
      ${bullets}
    </ul>

    ${footer}
  `;
}

<<<<<<< HEAD
    els.recommendations.innerHTML = `
      ${header}
      ${recs.slice(0, 5).map((r) => `<div class="recoLine">${r.text}</div>`).join("")}
    `;
  }
 
=======
>>>>>>> 1c20203251b091a0ddb247b0e8757103cffd7bab
function renderAlerts(payload) {
  if (!els.recentAlerts) return;

  const aqi = payload?.current?.aqi ?? null;
  const observedAt = payload?.current?.observed_at ?? null;
  const triggerIdx = payload?.thresholds?.effective_trigger_aqi ?? null;

  const lines = [];

  if (aqi && triggerIdx && observedAt) {
    const time = new Date(observedAt).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const currentName = aqiName(aqi);
    const triggerName = aqiName(triggerIdx);

    const alertActive = aqi >= triggerIdx;

    const msg = alertActive
      ? `⚠️ Alert triggered: Air quality is ${currentName}. This matches your current sensitivity setting.`
      : `Air quality is ${currentName}. No alert for your current sensitivity setting.`;

    lines.push({
      t: time,
      msg,
      alertActive,
    });
  }

  const backendAlerts = payload?.alerts || [];
  backendAlerts.slice(0, 4).forEach((a) => {
    const t = new Date(a.created_at).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    lines.push({
      t,
      msg: `${a.risk_level} risk: ${a.explanation}`,
      alertActive: true,
    });
  });

  if (!lines.length) {
    els.recentAlerts.innerHTML =
      `<div class="aa-alert-line"><span>—</span><span>No alerts yet</span></div>`;
    return;
  }

  els.recentAlerts.innerHTML = lines
    .map(
      (x) => `
        <div class="aa-alert-line ${x.alertActive ? "aa-alert-active" : ""}">
          <span>${x.t}</span>
          <span>— ${x.msg}</span>
        </div>
      `
    )
    .join("");
}

  /* -----------------------------
     5) Data loading functions
  -------------------------------- */

  async function loadLocationHistory() {
    const data = await apiFetch(API.locationHistory);
    locationsHistory = data?.locations || [];
  }

  // IMPORTANT: delete by URL param: DELETE /api/location/:id
  async function deleteSavedLocation(locationId) {
    await apiFetch(`${API.locationDeleteBase}/${locationId}`, { method: "DELETE" });
  }

  /*
    Saved searches:
    - clicking the pill switches location
    - clicking the × inside the pill deletes it
  */
  function renderSavedSearches() {
    if (!els.savedSearches) return;

    els.savedSearches.innerHTML = "";

    const list = locationsHistory.filter((l) => !sameLatLon(l, activeLocation));

    if (!list.length) {
      els.savedSearches.innerHTML =
        `<div class="aa-alert-line"><span>—</span><span>No other saved locations</span></div>`;
      return;
    }

    list.forEach((loc) => {
      // One pill button
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "aa-btn-ghost saved-pill";

      const label = document.createElement("span");
      label.className = "saved-pill-label";
      label.textContent = loc.label;

      // × inside the pill
      const del = document.createElement("button");
      del.type = "button";
      del.className = "saved-pill-remove";
      del.textContent = "×";
      del.setAttribute("aria-label", `Remove ${loc.label} from saved searches`);

      // Select on pill click
      pill.addEventListener("click", async () => {
        try {
          await apiFetch(API.locationSelect, {
            method: "PATCH",
            body: JSON.stringify({ locationId: loc.id }),
          });

          await loadDashboard();
        } catch (err) {
          alert(err.message);
        }
      });

      // Delete on × click
      del.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const ok = await confirmDelete(loc.label);
        if (!ok) return;

        try {
          await deleteSavedLocation(loc.id);

          // Always re-fetch from backend so we don't lie to the UI
          await loadLocationHistory();

          // If it still exists, backend didn't delete (or deleted only one duplicate)
          const stillExists = locationsHistory.some((x) => x.id === loc.id);
          if (stillExists) {
            alert("That location could not be removed. Please try again.");
          }

          renderSavedSearches();
        } catch (err) {
          alert(err.message);
        }
      });

      pill.appendChild(label);
      pill.appendChild(del);
      els.savedSearches.appendChild(pill);
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

  /* -----------------------------
     6) Event listeners
  -------------------------------- */

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
      if (els.currentDateTime) {
        els.currentDateTime.textContent = formatNowUK();
        setInterval(() => {
          els.currentDateTime.textContent = formatNowUK();
        }, 30_000);
      }

      await loadDashboard();
    } catch (err) {
      console.error(err);
      alert(err.message || "Dashboard failed to load.");
    }
  })();
});

// Enable Bootstrap tooltips for pollutant info icons
if (window.bootstrap?.Tooltip) {
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
    new bootstrap.Tooltip(el);
  });
}
async function loadNavbarUser() {
  const el = document.getElementById("welcomeUserName");
  if (!el) return;

  const token = localStorage.getItem("token");
  if (!token) {
    el.textContent = "Guest";
    return;
  }

  try {
    const res = await fetch("/api/dashboard", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      el.textContent = "User";
      return;
    }

    const payload = await res.json();
    const user = payload.user;

    el.textContent =
      user?.first_name ||
      (user?.email ? String(user.email).split("@")[0] : null) ||
      "User";
  } catch {
    el.textContent = "User";
  }
}
