/*
  Location Settings UX upgrade:
  - No browser alert()
  - Uses inline messaging + Bootstrap toast
  - Keeps behaviour: city OR postcode (not both)
  - Calls backend endpoints:
      GET /api/location
      POST/PATCH /api/location
      DELETE /api/location
  - Redirects to /dashboard after a successful save/update
*/

document.addEventListener("DOMContentLoaded", () => {
  /* -----------------------------
     1) DOM elements + constants
  -------------------------------- */
  const form = document.querySelector("#locationForm");
  const cityInput = document.querySelector("#cityInput");
  const postcodeInput = document.querySelector("#postcodeInput");
  const clearBtn = document.querySelector("#clearBtn");

  const formFeedback = document.querySelector("#formFeedback");
  const cityError = document.querySelector("#cityError");
  const postcodeError = document.querySelector("#postcodeError");
  const toastContainer = document.querySelector(".toast-container");

  const API_BASE = "/api/location";
  const REDIRECT_DELAY_MS = 800;

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

  function clearInlineErrors() {
    cityInput.classList.remove("is-invalid");
    postcodeInput.classList.remove("is-invalid");

    if (cityError) cityError.textContent = "";
    if (postcodeError) postcodeError.textContent = "";

    hideFormMessage();
  }

  function showFieldError(field, message) {
    if (field === "city") {
      cityInput.classList.add("is-invalid");
      if (cityError) cityError.textContent = message;
    }
    if (field === "postcode") {
      postcodeInput.classList.add("is-invalid");
      if (postcodeError) postcodeError.textContent = message;
    }
  }

  function showFormMessage(message, type = "info") {
    if (!formFeedback) return;

    // Bootstrap alert styles: alert-info, alert-success, alert-warning, alert-danger
    formFeedback.className = `alert alert-${type}`;
    formFeedback.textContent = message;
    formFeedback.classList.remove("d-none");
  }

  function hideFormMessage() {
    if (!formFeedback) return;
    formFeedback.classList.add("d-none");
  }

  function showToast({ title = "AirAware+", message, variant = "info", autohideMs = 3500 }) {
    // variant: success | danger | warning | info
    if (!toastContainer || !window.bootstrap) {
      // Fallback: inline message if toast not available
      showFormMessage(message, variant === "danger" ? "danger" : variant);
      return;
    }

    const toastEl = document.createElement("div");
    toastEl.className = `toast align-items-center text-bg-${variant} border-0`;
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");
    toastEl.setAttribute("aria-atomic", "true");

    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <strong class="me-1">${escapeHtml(title)}:</strong>
          ${escapeHtml(message)}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

    toastContainer.appendChild(toastEl);

    const toast = new window.bootstrap.Toast(toastEl, {
      delay: autohideMs,
      autohide: true,
    });

    toastEl.addEventListener("hidden.bs.toast", () => {
      toastEl.remove();
    });

    toast.show();
  }

  // tiny safety helper for toast HTML
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setBusy(isBusy) {
    const submitBtn = form?.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = isBusy;
      submitBtn.textContent = isBusy ? "Saving..." : "Save location";
    }
    if (clearBtn) clearBtn.disabled = isBusy;
    if (cityInput) cityInput.readOnly = isBusy;
    if (postcodeInput) postcodeInput.readOnly = isBusy;
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

  function validateAndBuildPayload() {
    const cityRaw = cityInput.value;
    const postRaw = postcodeInput.value;

    const city = normaliseCity(cityRaw);
    const postcode = normalisePostcode(postRaw);

    // Clear previous validation UI first
    clearInlineErrors();

    if (!city && !postcode) {
      showFormMessage("Please enter either a city or a postcode.", "warning");
      showFieldError("city", "Enter a city name, or use the postcode field instead.");
      showFieldError("postcode", "Enter a postcode, or use the city field instead.");
      throw new Error("Please enter either a city or a postcode.");
    }

    if (city && postcode) {
      showFormMessage("Please use only one field: city OR postcode.", "warning");
      showFieldError("city", "Remove the city OR clear the postcode.");
      showFieldError("postcode", "Remove the postcode OR clear the city.");
      throw new Error("Please use only one: city OR postcode.");
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
      throw new Error(data.error || data.message || `Request failed (${res.status})`);
    }

    return data;
  }

  /* -----------------------------
     3) API workflows
  -------------------------------- */
  async function loadExistingLocation() {
    try {
      const data = await apiFetch(API_BASE);
      if (!data?.location) return;

      // Inline "current location" message, not a success toast (less noisy)
      showFormMessage(`Current saved location: ${data.location.label}`, "info");

      // Clear inputs so user starts fresh
      cityInput.value = "";
      postcodeInput.value = "";
      syncDisableState();
    } catch (err) {
      // If API uses "No saved location" as a message, ignore it quietly
      if (String(err.message).toLowerCase().includes("no saved location")) return;

      console.error("Load location error:", err);
      showToast({
        variant: "warning",
        message: "We couldn’t load your saved location just now. You can still enter a new one.",
      });
    }
  }

  async function saveLocation() {
    const payload = validateAndBuildPayload();

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
    clearInlineErrors();

    await apiFetch(API_BASE, { method: "DELETE" });
  }

  function handleApiError(err) {
    const msg = err?.message || "Something went wrong. Please try again.";

    // Prefer inline for validation-ish messages; toast for general errors
    showFormMessage(msg, "danger");
    showToast({ variant: "danger", message: msg });
  }

  /* -----------------------------
     4) Events
  -------------------------------- */
  cityInput.addEventListener("input", () => {
    clearInlineErrors();
    syncDisableState();
  });

  postcodeInput.addEventListener("input", () => {
    clearInlineErrors();
    syncDisableState();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearInlineErrors();
    setBusy(true);

    try {
      const result = await saveLocation();

      const labelText = result.label ? `: ${result.label}` : "";
      showToast({
        variant: "success",
        message: `Location ${result.action}${labelText}. Redirecting to dashboard…`,
        autohideMs: 2500,
      });

      // Keep a subtle inline message too (helpful if toast missed)
      showFormMessage(`Location ${result.action}${labelText}. Redirecting…`, "success");

      await sleep(REDIRECT_DELAY_MS);
      window.location.replace("/dashboard");
    } catch (err) {
      handleApiError(err);
      setBusy(false);
    }
  });

  clearBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    clearInlineErrors();
    setBusy(true);

    try {
      await clearLocation();

      showToast({ variant: "success", message: "Location cleared." });
      showFormMessage("Location cleared. You can enter a new city or postcode.", "info");
    } catch (err) {
      handleApiError(err);
    } finally {
      setBusy(false);
    }
  });

  /* -----------------------------
     5) Init
  -------------------------------- */
  syncDisableState();
  loadExistingLocation();
});
