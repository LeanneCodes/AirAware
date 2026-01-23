/*
  What this page does:
  1) Lets the user save ONE location input: either a city OR a postcode (not both)
  2) Calls backend endpoints to:
     - GET current saved location (if any)
     - POST/PATCH to save/update location
     - DELETE to clear location
  3) Redirects to /dashboard after a successful save/update
*/

document.addEventListener("DOMContentLoaded", () => {
  /* -----------------------------
     1) DOM elements + constants
  -------------------------------- */

  const form = document.querySelector("#locationForm");
  const cityInput = document.querySelector("#cityInput");
  const postcodeInput = document.querySelector("#postcodeInput");
  const clearBtn = document.querySelector("#clearBtn");
  const successEl = document.querySelector("#saveSuccess");

  const API_BASE = "/api/location";
  const REDIRECT_DELAY_MS = 800;

  /* -----------------------------
     2) Small helpers (simple + reusable)
  -------------------------------- */

  // Pause helper so we can show a success message briefly before redirecting.
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

  // Read token. If missing, user is not logged in, so send them to /login.
  function getTokenOrRedirect() {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.replace("/login");
      return null;
    }
    return token;
  }

  /*
    Normalising input:
    We keep it light because we do not want to "correct" what a user types.
    We only:
    - trim spaces
    - collapse multiple spaces into one
  */
  function normaliseCity(raw) {
    return raw.trim().replace(/\s+/g, " ");
  }

  /*
    UK postcode normalising (lightweight):
    - trim
    - uppercase
    - collapse multiple spaces
    - insert a space before the last 3 characters if user did not add one
      Example: "SW1P1RT" -> "SW1P 1RT"
  */
  function normalisePostcode(raw) {
    let pc = raw.trim().toUpperCase().replace(/\s+/g, " ");
    if (!pc.includes(" ") && pc.length > 3) {
      pc = pc.slice(0, -3) + " " + pc.slice(-3);
    }
    return pc;
  }

  /*
    syncDisableState:
    We only want the user to fill in ONE of the two inputs.
    Behaviour:
    - If city is typed, disable postcode input
    - If postcode is typed, disable city input
    - If both empty, enable both
  */
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

  /*
    getPayload:
    Creates the request body we send to the backend.

    Rules:
    - Must include exactly one of: { city } OR { postcode }
    - Throws an error if user input is invalid (so caller can show alert)
  */
  function getPayload() {
    const city = normaliseCity(cityInput.value);
    const postcode = normalisePostcode(postcodeInput.value);

    if (!city && !postcode) {
      throw new Error("Please enter either a city or a postcode.");
    }

    if (city && postcode) {
      throw new Error("Please use only one: city OR postcode.");
    }

    // We deliberately do not rewrite the input box values (UX choice).
    // We only send the cleaned value to the API.
    return city ? { city } : { postcode };
  }

  /*
    apiFetch:
    - Adds auth token automatically
    - Sends JSON (Content-Type)
    - Parses JSON response safely
    - Throws a meaningful error if backend returns non-OK
  */
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
     3) Page actions (API workflows)
  -------------------------------- */

  /*
    loadExistingLocation:
    - Calls GET /api/location
    - If a location exists, show it to the user in the success banner
    - Clear inputs so the user starts fresh
  */
  async function loadExistingLocation() {
    try {
      const data = await apiFetch(API_BASE);
      if (!data?.location) return;

      showSuccess(`Current saved location: ${data.location.label}`);

      // We clear the inputs because the saved location is already displayed above.
      // This also avoids confusion about "is the value already submitted?"
      cityInput.value = "";
      postcodeInput.value = "";
      syncDisableState();
    } catch (err) {
      // Some backends might return a message like "No saved location".
      // That is not an error for us, so we ignore it.
      if (String(err.message).toLowerCase().includes("no saved location")) return;

      console.error("Load location error:", err);
    }
  }

  /*
    saveLocation:
    - Builds payload from input
    - Tries POST first (create)
    - If POST fails, tries PATCH (update) as a fallback

    Why do this:
    - Some APIs may only allow POST once, then require PATCH to change it
    - This keeps the front-end simple without having to know server state
  */
  async function saveLocation() {
    const payload = getPayload();

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

  /*
    clearLocation:
    - Clears the input fields
    - Sends DELETE /api/location to remove the saved location
    - Shows a success banner
  */
  async function clearLocation() {
    cityInput.value = "";
    postcodeInput.value = "";
    syncDisableState();

    await apiFetch(API_BASE, { method: "DELETE" });
    showSuccess("Location successfully cleared.");
  }

  /* -----------------------------
     4) Event listeners (user actions)
  -------------------------------- */

  cityInput.addEventListener("input", () => {
    hideSuccess();
    syncDisableState();
  });

  postcodeInput.addEventListener("input", () => {
    hideSuccess();
    syncDisableState();
  });

  // Form submit: save location then redirect to dashboard
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

      // Small delay so user sees feedback before navigation
      await sleep(REDIRECT_DELAY_MS);

      window.location.replace("/dashboard");
    } catch (err) {
      alert(err.message);
    }
  });

  // Clear button: delete saved location
  clearBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    hideSuccess();

    try {
      await clearLocation();
    } catch (err) {
      alert(err.message);
    }
  });

  /* -----------------------------
     5) Initial setup on page load
  -------------------------------- */

  syncDisableState();
  loadExistingLocation();
});
