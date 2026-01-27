/*
  Profile behaviour:
  - Inline form feedback (#formFeedback) for errors only
  - Toast (top-right under navbar) for success + redirecting
  - No alert()

  Navbar name behaviour:
  - Reads cached name from localStorage immediately to avoid "User" flash
  - Fetches /api/user/me in background to keep it accurate
  - After successful profile save, updates the cached name + navbar instantly
*/

document.addEventListener("DOMContentLoaded", () => {

  const form = document.querySelector(".formGrid");
  const saveBtn = document.getElementById("saveProfileBtn");
  const toastContainer = document.getElementById("aaToastContainer");

  if (!form) return;

  // Clear error state as user types
  form.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("input", clearFormMessage);
    el.addEventListener("change", clearFormMessage);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearFormMessage();
    setSubmittingState(saveBtn, true);

    try {
      const profileData = readProfileInputs();

      if (Object.keys(profileData).length === 0) {
        setSubmittingState(saveBtn, false);
        showFormMessage("Please fill in at least one field before saving.", "warning");
        return;
      }

      const updated = await updateProfile(profileData);

      // Keep navbar name consistent across pages (cache + update instantly)
      syncCachedNavbarNameFromUserResponse(updated);

      showToast({
        container: toastContainer,
        variant: "success",
        message: "Profile saved. Redirecting…",
        autohideMs: 2000,
      });

      setTimeout(() => {
        window.location.href = "/threshold";
      }, 500);
    } catch (err) {
      console.error("Profile update error:", err);
      showFormMessage(err.message || "Profile update failed. Please try again.", "danger");
      setSubmittingState(saveBtn, false);
    }
  });
});

/* -----------------------------
   Toast helper (success only)
-------------------------------- */

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast({ container, message, variant = "info", autohideMs = 3000 }) {
  if (!container || !window.bootstrap?.Toast) return;

  const toastEl = document.createElement("div");
  toastEl.className = `toast align-items-center text-bg-${variant} border-0`;
  toastEl.setAttribute("role", "status");
  toastEl.setAttribute("aria-live", "polite");
  toastEl.setAttribute("aria-atomic", "true");

  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${escapeHtml(message)}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  container.appendChild(toastEl);

  const toast = new window.bootstrap.Toast(toastEl, { delay: autohideMs, autohide: true });
  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
  toast.show();
}

/* -----------------------------
   UI helpers (inline feedback for errors only)
-------------------------------- */

function showFormMessage(message, type = "danger") {
  const el = document.getElementById("formFeedback");
  if (!el) return;

  el.textContent = message;
  el.className = `alert alert-${type}`;
  el.classList.remove("d-none");
  el.style.borderLeft = "4px solid #185f85";
}

function clearFormMessage() {
  const el = document.getElementById("formFeedback");
  if (!el) return;

  el.classList.add("d-none");
  el.textContent = "";
}

function setSubmittingState(buttonEl, isSubmitting) {
  if (!buttonEl) return;

  buttonEl.disabled = isSubmitting;
  buttonEl.setAttribute("aria-busy", String(isSubmitting));

  if (isSubmitting) {
    buttonEl.dataset.originalText = buttonEl.textContent;
    buttonEl.textContent = "Saving…";
  } else {
    buttonEl.textContent = buttonEl.dataset.originalText || "Save profile";
    delete buttonEl.dataset.originalText;
  }
}

/* -----------------------------
   Read inputs (only send filled fields)
-------------------------------- */

function readProfileInputs() {
  const raw = {
    first_name: document.getElementById("firstName")?.value?.trim(),
    last_name: document.getElementById("lastName")?.value?.trim(),
    date_of_birth: document.getElementById("dob")?.value,
    sex_at_birth: document.getElementById("sexAtBirth")?.value,
    gender: document.getElementById("gender")?.value,
    nationality: document.getElementById("nationality")?.value?.trim(),
  };

  const cleaned = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value !== null && value !== "") {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

/* -----------------------------
   API call
-------------------------------- */

async function updateProfile(profile) {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("You’re logged out. Please log in again.");
  }

  let res;
  try {
    res = await fetch(`${window.API_BASE}/api/user/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profile),
    });
  } catch (_) {
    throw new Error("Unable to reach the server. Please try again.");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("Your session has expired. Please log in again.");
    }
    throw new Error(data?.error || data?.message || "Profile update failed.");
  }

  return data;
}

/* -----------------------------
   Navbar user name (no flash)
-------------------------------- */

function getUserFromApiResponse(data) {
  // Support common shapes:
  // - { user: {...} }
  // - { data: { user: {...} } }
  // - { ...userFields }
  return data?.user || data?.data?.user || data;
}

function buildDisplayName(user) {
  if (!user) return null;

  const first =
    (typeof user.first_name === "string" ? user.first_name.trim() : "") ||
    (typeof user.name === "string" ? user.name.trim() : "");

  if (first) return first;

  const email = typeof user.email === "string" ? user.email : "";
  if (email.includes("@")) return email.split("@")[0];

  return null;
}

function setNavbarName(name) {
  const el = document.getElementById("welcomeUserName");
  if (!el) return;
  el.textContent = name || "User";
}

function syncCachedNavbarNameFromUserResponse(data) {
  const user = getUserFromApiResponse(data);
  const name = buildDisplayName(user);
  if (!name) return;

  localStorage.setItem("aa_user_name", name);
  setNavbarName(name);
}
