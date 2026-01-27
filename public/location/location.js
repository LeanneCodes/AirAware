/*
  Location Settings UX upgrade

  Notes:
  - Toasts are used for meaningful user feedback (save/update + redirect, general failures).
  - Clear & choose again is a UI reset. It should not show a toast.
  - DELETE /api/location is only called if we believe a saved location exists.
  - “API route not found” (or similar backend noise) is never shown to the user during clear.
  - Clear button is disabled when both fields are empty.
  - Validation does not show a toast directly; the submit handler shows a single toast.
*/

document.addEventListener("DOMContentLoaded", () => {
  /* -----------------------------
     1) DOM elements + constants
  -------------------------------- */
  const form = document.querySelector("#locationForm");
  const cityInput = document.querySelector("#cityInput");
  const postcodeInput = document.querySelector("#postcodeInput");
  const clearBtn = document.querySelector("#clearBtn");

  const toastContainer = document.getElementById("aaToastContainer");

  const BASE_URL = window.API_BASE || "http://localhost:3000";
  const LOCATION_API = `${BASE_URL}/api/location`;

  const REDIRECT_DELAY_MS = 800;

  // Track busy state so syncDisableState doesn't re-enable clearBtn mid-request
  let isBusy = false;

  // Track whether a saved location exists (so "Clear" doesn't hit DELETE unnecessarily)
  let hasSavedLocation = false;

  if (!form || !cityInput || !postcodeInput || !clearBtn) {
    console.error("Location page is missing required elements.");
    return;
  }

  /* -----------------------------
     2) Small helpers
  -------------------------------- */
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showToast({ title = "AirAware+", message, variant = "info", autohideMs = 3500 }) {
    if (!toastContainer || !window.bootstrap?.Toast) return;

    const toastEl = document.createElement("div");
    toastEl.className = `toast align-items-center text-bg-${variant} border-0`;
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");
    toastEl.setAttribute("aria-atomic", "true");

    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <strong class="me-1">${escapeHtml(title)}:</strong> ${escapeHtml(message)}
        </div>
        <button
          type="button"
          class="btn-close btn-close-white me-2 m-auto"
          data-bs-dismiss="toast"
          aria-label="Close"
        ></button>
      </div>
    `;

    toastContainer.appendChild(toastEl);

    const toast = new window.bootstrap.Toast(toastEl, {
      delay: autohideMs,
      autohide: true,
    });

    toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
    toast.show();
  }

  function setBusy(nextBusy) {
    isBusy = nextBusy;

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = nextBusy;
      submitBtn.textContent = nextBusy ? "Saving..." : "Save location";
    }

    clearBtn.disabled = nextBusy;

    cityInput.readOnly = nextBusy;
    postcodeInput.readOnly = nextBusy;
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

    // Disable clear button when both inputs are empty (do not override busy state)
    if (!isBusy) {
      clearBtn.disabled = !(city || post);
    }
  }

  function makeValidationError(message) {
    const err = new Error(message);
    err.isValidation = true;
    return err;
  }

  function validateAndBuildPayload() {
    const city = normaliseCity(cityInput.value);
    const postcode = normalisePostcode(postcodeInput.value);

    // Important: do not show toasts here, only throw a validation error.
    if (!city && !postcode) {
      throw makeValidationError("Please enter either a city or a postcode.");
    }

    if (city && postcode) {
      throw makeValidationError("Please use only one field: city OR postcode.");
    }

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
      const msg = data.error || data.message || `Request failed (${res.status})`;
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }

    return data;
  }

  function isNotFoundError(err) {
    const msg = String(err?.message || "").toLowerCase();
    return (
      err?.status === 404 ||
      msg.includes("not found") ||
      msg.includes("could not find") ||
      msg.includes("unknown city") ||
      msg.includes("invalid postcode")
    );
  }

  /* -----------------------------
     3) API workflows
  -------------------------------- */
  async function loadExistingLocation() {
    try {
      const data = await apiFetch(LOCATION_API);

      if (data?.location) {
        hasSavedLocation = true;
        showToast({ variant: "info", message: `Current saved location: ${data.location.label}` });
      } else {
        hasSavedLocation = false;
      }

      cityInput.value = "";
      postcodeInput.value = "";
      syncDisableState();
    } catch (err) {
      const msg = String(err.message || "").toLowerCase();
      if (msg.includes("no saved location")) return;

      console.error("Load location error:", err);
    }
  }

  async function saveLocation() {
    const payload = validateAndBuildPayload();

    try {
      const data = await apiFetch(LOCATION_API, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      hasSavedLocation = true;
      return { action: "saved", label: data?.location?.label || null };
    } catch {
      const data = await apiFetch(LOCATION_API, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      hasSavedLocation = true;
      return { action: "updated", label: data?.location?.label || null };
    }
  }

  async function clearLocation() {
    cityInput.value = "";
    postcodeInput.value = "";
    syncDisableState();

    if (!hasSavedLocation) return;

    try {
      await apiFetch(LOCATION_API, { method: "DELETE" });
      hasSavedLocation = false;
    } catch (err) {
      console.warn("Clear location API call failed (suppressed):", err?.message);
      hasSavedLocation = false;
    }
  }

  /* -----------------------------
     4) Events
  -------------------------------- */
  cityInput.addEventListener("input", () => {
    syncDisableState();
  });

  postcodeInput.addEventListener("input", () => {
    syncDisableState();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setBusy(true);

    try {
      const result = await saveLocation();
      const labelText = result.label ? `: ${result.label}` : "";

      showToast({
        variant: "success",
        message: `Location ${result.action}${labelText}. Redirecting…`,
        autohideMs: 2200,
      });

      await sleep(REDIRECT_DELAY_MS);
      window.location.replace("/dashboard");
    } catch (err) {
      console.error(err);

      if (err?.isValidation) {
        showToast({
          variant: "warning",
          message: err.message || "Please check your inputs and try again.",
          autohideMs: 3500,
        });
      } else if (isNotFoundError(err)) {
        showToast({
          variant: "warning",
          message: err.message || "We couldn’t find that location. Please check and try again.",
          autohideMs: 4500,
        });
      } else {
        showToast({
          variant: "danger",
          message: err.message || "Something went wrong. Please try again.",
          autohideMs: 4500,
        });
      }

      setBusy(false);
      syncDisableState();
    }
  });

  clearBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (clearBtn.disabled) return;

    setBusy(true);
    try {
      await clearLocation();
    } finally {
      setBusy(false);
      syncDisableState();
    }
  });

  /* -----------------------------
     5) Init
  -------------------------------- */
  syncDisableState();
  loadExistingLocation();
});