document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#locationForm");
  const cityInput = document.querySelector("#cityInput");
  const postcodeInput = document.querySelector("#postcodeInput");
  const clearBtn = document.querySelector("#clearBtn");
  const successEl = document.querySelector("#saveSuccess");

  const API_BASE = "/api/location";
  const REDIRECT_DELAY_MS = 800;

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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

  // Keep this light: don't "correct" spelling/casing.
  // Just trim and collapse multiple spaces so we don't send messy strings.
  function normaliseCity(raw) {
    return raw.trim().replace(/\s+/g, " ");
  }

  function normalisePostcode(raw) {
    let pc = raw.trim().toUpperCase().replace(/\s+/g, " ");
    // If typed without a space, insert before last 3 chars (e.g. SW1P1RT -> SW1P 1RT)
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

    if (!city && !postcode) {
      throw new Error("Please enter either a city or a postcode.");
    }
    if (city && postcode) {
      throw new Error("Please use only one: city OR postcode.");
    }

    // IMPORTANT: we do NOT overwrite the input boxes with resolved labels.
    // We only send a cleaned value to the backend.
    return city ? { city } : { postcode };
  }

  async function apiFetch(path, options = {}) {
    const token = getTokenOrRedirect();
    if (!token) return null;

    const res = await fetch(path, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
      body: options.body,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || `Request failed (${res.status})`);
    }
    return data;
  }

  async function loadExistingLocation() {
    try {
      const data = await apiFetch(API_BASE);
      if (!data?.location) return;

      // Show what is actually saved in DB, without overwriting what the user typed.
      showSuccess(`Current saved location: ${data.location.label}`);
      cityInput.value = "";
      postcodeInput.value = "";
      syncDisableState();
    } catch (err) {
      // no saved location yet is fine
      if (String(err.message).toLowerCase().includes("no saved location")) return;
      console.error("Load location error:", err);
    }
  }

  async function saveLocation() {
    const payload = getPayload();

    // POST first; if it fails (e.g. constraints/logic), PATCH fallback
    try {
      const data = await apiFetch(API_BASE, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return { action: "saved", label: data?.location?.label || null };
    } catch {
      const data = await apiFetch(API_BASE, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return { action: "updated", label: data?.location?.label || null };
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

      if (result.label) {
        showSuccess(`Location ${result.action} as: ${result.label}`);
      } else {
        showSuccess(`Location ${result.action} successfully.`);
      }

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
  loadExistingLocation();
});
