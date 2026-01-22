document.addEventListener("DOMContentLoaded", async () => {
  const TOKEN_KEY = "airaware_token";
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    console.warn("No auth token found – homepage will stay static");
    return;
  }

  try {
    const res = await fetch("/api/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Dashboard fetch failed");

    const payload = await res.json();
    applyHomepage(payload);

  } catch (err) {
    console.error("Homepage load error:", err);
  }
});

function applyHomepage(payload) {
  const { location, user, current, status } = payload;

  
  if (location) {
    const labelEl = document.getElementById("locationLabel");
    const mapLink = document.getElementById("viewOnMap");

    if (labelEl) labelEl.textContent = location.label;

    if (mapLink) {
      mapLink.href = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    }

    if (window.L && document.getElementById("miniMap")) {
      const map = L.map("miniMap", {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        tap: false,
      }).setView([location.latitude, location.longitude], 11);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      L.marker([location.latitude, location.longitude]).addTo(map);
    }
  }

 
  const sensitivityEl = document.getElementById("userSensitivity");
  if (sensitivityEl && user?.sensitivity_level) {
    sensitivityEl.textContent =
      user.sensitivity_level.charAt(0).toUpperCase() +
      user.sensitivity_level.slice(1);
  }

 
  const pollutantEl = document.getElementById("primaryPollutant");
  if (pollutantEl && status?.dominant_pollutant) {
    pollutantEl.textContent = status.dominant_pollutant;
  }
}
