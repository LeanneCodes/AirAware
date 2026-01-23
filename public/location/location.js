document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#locationForm");
  const cityInput = document.querySelector("#cityInput");
  const postcodeInput = document.querySelector("#postcodeInput");
  const clearBtn = document.querySelector("#clearBtn");
  const successEl = document.querySelector("#saveSuccess");

  const API_BASE = "/api/location";
  const REDIRECT_DELAY_MS = 800;

  /* Helper functions */

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function showSuccess(msg) {
    if (!successEl) return;
    successEl.textContent = msg;
    successEl.style.display = "block";
  }

  function hideSuccess() {
    if (!successEl) return;
    successEl.style.display = "none";
  }

  function getTokenOrRedirect() {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.replace("/login");
      return null;
    }
    return token;
  }

  function normaliseCity(raw) {
    return raw.trim().replace(/\s+/g, " ");
  }

  function normalisePostcode(raw) {
    let pc = raw.trim().toUpperCase().replace(/\s+/g, " ");
    if (!pc.includes(" ") && pc.length > 3) {
      pc = pc.slice(0, -3) + " " + pc.slice(-3);
    }
    return pc;
  }

  function syncDisableState() {
    const city = cityInput.value.trim();
    const post = postcodeInput.value.trim();

    if (city && !post) {
      postcodeInput.disabled = true;
      cityInput.disabled = false;
    } else if (post && !city) {
      cityInput.disabled = true;
      postcodeInput.disabled = false;
    } else {
      cityInput.disabled = false;
      postcodeInput.disabled = false;
    }
  }

  function getPayload() {
    const city = normaliseCity(cityInput.value);
    const postcode = normalisePostcode(postcodeInput.value);

    cityInput.value = city;
    postcodeInput.value = postcode;

    if (!city && !postcode) {
      throw new Error("Please enter either a city or a postcode.");
    }
    if (city && postcode) {
      throw new Error("Please use only one: city OR postcode.");
    }

    return city ? { city } : { postcode };
  }

  async function apiFetch(path, options = {}) {
    const token = getTokenOrRedirect();
    if (!token) return;

    const res = await fetch(path, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: options.body,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }

    return data;
  }

  /* Core Logic */

  async function saveLocation() {
    const payload = getPayload();

    try {
      await apiFetch(API_BASE, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return "saved";
    } catch {
      await apiFetch(API_BASE, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return "updated";
    }
  }

  async function clearLocation() {
    cityInput.value = "";
    postcodeInput.value = "";
    syncDisableState();

    await apiFetch(API_BASE, { method: "DELETE" });
    showSuccess("Location successfully cleared.");
  }

  cityInput.addEventListener("input", () => {
    hideSuccess();
    syncDisableState();
  });

  postcodeInput.addEventListener("input", () => {
    hideSuccess();
    syncDisableState();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideSuccess();

    try {
      const result = await saveLocation();

      showSuccess(
        result === "saved"
          ? "Location saved successfully."
          : "Location updated successfully."
      );

      await sleep(REDIRECT_DELAY_MS);
      window.location.replace("/dashboard");

    } catch (err) {
      alert(err.message);
    }
  });

  clearBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    hideSuccess();

    try {
      await clearLocation();
    } catch (err) {
      alert(err.message);
    }
  });

  syncDisableState();
});
