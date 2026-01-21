export function initDashboard(doc = document, deps = {}) {
  const storage = deps.storage ?? window.localStorage;
  const locationKey = deps.locationKey ?? "airaware_location";
  const profileKey = deps.profileKey ?? "airaware_profile";

  const homepageUrl = deps.homepageUrl ?? "../public/index.html";

  const welcomeChip = doc.querySelector("#welcomeChip");
  const locationText = doc.querySelector("#locationText");
  const refreshBtn = doc.querySelector("#refreshBtn");
  const alertsBtn = doc.querySelector("#alertsBtn");

  function wireHomepageLink() {
    const homepageEl = Array.from(doc.querySelectorAll(".chip, a"))
      .find((el) => (el.textContent || "").trim().toLowerCase() === "homepage");

    if (!homepageEl) return;

    homepageEl.setAttribute("href", homepageUrl);

    homepageEl.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = homepageUrl;
    });
  }

  function safeParse(key) {
    try {
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setWelcomeName() {
    const profile = safeParse(profileKey);
    const name = profile?.firstName?.trim() || profile?.lastName?.trim() || "User";
    if (welcomeChip) welcomeChip.textContent = `Welcome, ${name}!`;
  }

  function setLocationBar() {
    const loc = safeParse(locationKey);

    if (!locationText) return;

    if (!loc) {
      locationText.textContent = "Current Location: Not set yet";
      return;
    }
    locationText.textContent = `Current Location: ${loc.value}`;
  }

  const metricMap = {
    pm25: { value: "#pm25Value", status: "#pm25Status" },
    o3: { value: "#o3Value", status: "#o3Status" },
    co: { value: "#coValue", status: "#coStatus" },
    so2: { value: "#so2Value", status: "#so2Status" },
    no2: { value: "#no2Value", status: "#no2Status" },
  };

  function statusFromValue(v) {
    if (v >= 80) return "unhealthy";
    if (v >= 50) return "moderate";
    return "good";
  }

  function setMetric(metric, value) {
    const sel = metricMap[metric];
    if (!sel) return;

    const valueEl = doc.querySelector(sel.value);
    const statusEl = doc.querySelector(sel.status);

    if (valueEl) valueEl.textContent = String(value);
    if (statusEl) statusEl.textContent = statusFromValue(value);
  }

  function setAllMetrics(data) {
    Object.keys(metricMap).forEach((m) => {
      if (typeof data[m] === "number") setMetric(m, data[m]);
    });
  }

  function randomMetrics() {
    const r = () => Math.floor(30 + Math.random() * 70);
    return { pm25: r(), o3: r(), co: r(), so2: r(), no2: r() };
  }

  async function refreshData() {
    const data = randomMetrics();
    setAllMetrics(data);
    return data;
  }

  function onAlerts() {
    const recentAlerts = doc.querySelector("#recentAlerts");
    if (recentAlerts) {
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      recentAlerts.innerHTML = `${now} - Alerts clicked<br/>` + recentAlerts.innerHTML;
    }
    return true;
  }

  refreshBtn?.addEventListener("click", refreshData);
  alertsBtn?.addEventListener("click", onAlerts);

  wireHomepageLink();
  setWelcomeName();
  setLocationBar();

  return {
    wireHomepageLink,
    setWelcomeName,
    setLocationBar,
    refreshData,
    onAlerts,
  };
}
