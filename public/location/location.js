document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#locationForm");
  const cityInput = document.querySelector("#cityInput");
  const postcodeInput = document.querySelector("#postcodeInput");
  const clearBtn = document.querySelector("#clearBtn");
  const successEl = document.querySelector("#saveSuccess");

  const API_BASE = "/api/location";

  function showSuccess(msg) {
    if (!successEl) return;
    successEl.textContent = msg;
    successEl.style.display = "block";
  }

  function hideSuccess() {
    if (!successEl) return;
    successEl.style.display = "none";
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
    const city = cityInput.value.trim();
    const post = postcodeInput.value.trim();

    if (!city && !post) {
      return { error: "Please enter either a city or a postcode." };
    }
    if (city && post) {
      return { error: "Please use only one: city OR postcode." };
    }
    return city ? { city } : { postcode: post };
  }

  async function apiFetch(url, options) {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      credentials: "include", 
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.error || data.message || `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  }

  
  async function saveLocation() {
    const payload = getPayload();
    if (payload.error) throw new Error(payload.error);

    try {
      await apiFetch(API_BASE, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showSuccess("Location saved successfully.");
    } catch (err) {
  
      if (String(err.message).toLowerCase().includes("already") || String(err.message).includes("POST /location first")) {
        await apiFetch(API_BASE, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        showSuccess("Location updated successfully.");
      } else {
        throw err;
      }
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
      await saveLocation();
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
