  export function initDashboardPage(doc = document, deps = {}) {
  const fetchFn = deps.fetchFn ?? window.fetch.bind(window);
  const storage = deps.storage ?? window.localStorage;

  
  const navHomeLinks = [...doc.querySelectorAll('a[href*="index.html"], a[href*="homepage"]')];
  const navLogoLink = doc.querySelector(".navleft");

  
  const refreshBtn = doc.querySelector("#refreshBtn");

  const riskText = doc.querySelector("#riskText");
  const cityName = doc.querySelector("#cityName");
  const currentDate = doc.querySelector("#currentDate");
  const aqStatus = doc.querySelector("#aqStatus");

  const recentAlerts = doc.querySelector("#recentAlerts");
  const recommendations = doc.querySelector("#recommendations");

  
  let errorBox = doc.querySelector("#dashError");
  let loadingTag = doc.querySelector("#dashLoading");

  
  const metricMap = {
    pm25: { value: "#pm25Value", label: "#pm25Label" },
    pm10: { value: "#pm10Value", label: "#pm10Label" },
    so2:  { value: "#so2Value",  label: "#so2Label" },
    no2:  { value: "#no2Value",  label: "#no2Label" },
    o3:   { value: "#o3Value",   label: "#o3Label" },
    co:   { value: "#coValue",   label: "#coLabel" },
  };

  const savedButtons = [...doc.querySelectorAll("[data-city]")];

  
  let currentCity = storage.getItem("airaware_city") || "London";

 
  function ensureStatusElements() {
    
    if (!errorBox) {
      errorBox = doc.createElement("div");
      errorBox.id = "dashError";
      errorBox.style.display = "none";
      errorBox.style.margin = "10px 0";
      errorBox.style.padding = "10px 12px";
      errorBox.style.borderRadius = "12px";
      errorBox.style.background = "rgba(0,0,0,.55)";
      errorBox.style.color = "white";
      errorBox.style.fontWeight = "700";
      const anchor = doc.querySelector(".center") || doc.body;
      anchor.prepend(errorBox);
    }

    if (!loadingTag) {
      loadingTag = doc.createElement("div");
      loadingTag.id = "dashLoading";
      loadingTag.style.display = "none";
      loadingTag.style.margin = "10px 0";
      loadingTag.style.textAlign = "center";
      loadingTag.style.fontWeight = "800";
      loadingTag.style.color = "rgba(15,23,42,.85)";
      const anchor = doc.querySelector(".center") || doc.body;
      anchor.prepend(loadingTag);
    }
  }

  function setLoading(isLoading) {
    if (!loadingTag) return;
    loadingTag.style.display = isLoading ? "block" : "none";
    loadingTag.textContent = isLoading ? "Loading dashboard data..." : "";
    if (refreshBtn) refreshBtn.disabled = isLoading;
  }

  function setError(msg) {
    if (!errorBox) return;
    errorBox.style.display = msg ? "block" : "none";
    errorBox.textContent = msg || "";
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setActiveSaved(city) {
    savedButtons.forEach(btn => {
      const btnCity = (btn.getAttribute("data-city") || "").toLowerCase();
      btn.classList.toggle("active", btnCity === city.toLowerCase());
    });
  }

  function updateRiskBanner(level, dominant) {
    if (!riskText) return;
    const lv = level || "Medium";
    const dom = dominant || "Unknown";
    riskText.textContent = `${lv} Risk | Dominant pollutant: ${dom}, based on your alert threshold`;
  }

  function updateTopInfo(data) {
    if (cityName) cityName.textContent = data.city || currentCity;
    if (currentDate) currentDate.textContent = data.timeText || "-";
    if (aqStatus) aqStatus.textContent = data.airQualityLabel || "Unknown";
  }

  function updateMetrics(metrics = {}) {
    Object.keys(metricMap).forEach((k) => {
      const vEl = doc.querySelector(metricMap[k].value);
      const lEl = doc.querySelector(metricMap[k].label);

      const v = metrics[k];
      if (vEl) vEl.textContent = (v === null || v === undefined) ? "-" : String(v);

      
      if (lEl && metrics[`${k}Label`]) lEl.textContent = String(metrics[`${k}Label`]);
    });
  }

  function updateAlerts(alerts = []) {
    if (!recentAlerts) return;
    if (!alerts.length) {
      recentAlerts.innerHTML = `<div class="alertItem">No recent alerts</div>`;
      return;
    }
    recentAlerts.innerHTML = alerts
      .slice(0, 6)
      .map(a => `<div class="alertItem">${escapeHtml(a.time)} — ${escapeHtml(a.message)}</div>`)
      .join("");
  }

  function updateRecommendations(list = []) {
    if (!recommendations) return;
    if (!list.length) {
      recommendations.innerHTML = `<div>Conditions look favourable today based on your profile.</div>`;
      return;
    }
    recommendations.innerHTML = list.slice(0, 6).map(t => `<div>${escapeHtml(t)}</div>`).join("");
  }

  
  function updateChart(series = []) {
   
    return series;
  }
  
  async function fetchDashboard(city) {
    
    const url = `/api/dashboard?label=${encodeURIComponent(city)}`;
    const res = await fetchFn(url);
    if (!res.ok) throw new Error(`Dashboard API failed (${res.status})`);
    return res.json();
  }

  async function loadDashboard(city, { pushHistory = true } = {}) {
    ensureStatusElements();
    setError("");
    setLoading(true);

    try {
      currentCity = city;
      storage.setItem("airaware_city", currentCity);
      setActiveSaved(currentCity);

      const data = await fetchDashboard(currentCity);

      updateRiskBanner(data.riskLevel, data.dominantPollutant);
      updateTopInfo(data);
      updateMetrics(data.metrics);
      updateAlerts(data.alerts);
      updateRecommendations(data.recommendations);
      updateChart(data.series);

      if (pushHistory) {
        const newUrl = `${window.location.pathname}?city=${encodeURIComponent(currentCity)}`;
        window.history.pushState({ city: currentCity }, "", newUrl);
      }
    } catch (err) {
      console.error(err);
      setError("Could not load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  
  function wireNavbar() {
    
    if (navLogoLink) {
      
      if (!navLogoLink.getAttribute("href")) navLogoLink.setAttribute("href", "./index.html");
    }

    
    navHomeLinks.forEach(a => {
      a.addEventListener("click", () => {
      y
      });
    });
  }

  
  function wireEvents() {
    refreshBtn?.addEventListener("click", () => loadDashboard(currentCity, { pushHistory: false }));

    savedButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const city = btn.getAttribute("data-city");
        if (city) loadDashboard(city);
      });
    });

    
    window.addEventListener("popstate", (e) => {
      const city = e.state?.city || new URLSearchParams(window.location.search).get("city") || storage.getItem("airaware_city") || "London";
      loadDashboard(city, { pushHistory: false });
    });
  }

 
  function init() {
    wireNavbar();
    wireEvents();

    
    const qsCity = new URLSearchParams(window.location.search).get("city");
    const initial = qsCity || currentCity;
    loadDashboard(initial, { pushHistory: false });
  }

  init();

  return { loadDashboard, fetchDashboard };
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => initDashboardPage());
}
