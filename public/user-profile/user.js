/*
  Profile behaviour:
  - Inline form feedback (#formFeedback) for errors only
  - Toast (top-right under navbar) for success + redirecting
  - No alert()

  Prefill behaviour:
  - On page load, GET /api/user/me and prefill fields if present
  - Do not block the page if prefill fails

  Update behaviour:
  - Only send fields that actually changed

  Delete profile behaviour:
  - Uses DELETE /api/user/me
  - Requires typing DELETE to confirm
  - On success clears localStorage and redirects to /signup

  Navbar behaviour:
  - Navbar is handled by /shared/navbar-user.js
  - This file only updates localStorage (aa_user_name) after a successful save
*/

let originalProfile = null;

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector(".formGrid");
  const saveBtn = document.getElementById("saveProfileBtn");
  const toastContainer = document.getElementById("aaToastContainer");

  const openDeleteBtn = document.getElementById("openDeleteAccountBtn");
  const deleteModalEl = document.getElementById("deleteAccountModal");
  const confirmDeleteBtn = document.getElementById("confirmDeleteAccountBtn");
  const deleteConfirmInput = document.getElementById("deleteConfirmInput");

  if (!form) return;

  wireDeleteAccount({
    openDeleteBtn,
    deleteModalEl,
    confirmDeleteBtn,
    deleteConfirmInput,
    toastContainer,
  });

  // Prefill from API
  try {
    const me = await fetchMyProfile();
    originalProfile = me || null;
    fillProfileForm(me);
  } catch (err) {
    console.warn("Prefill failed:", err?.message || err);
  }

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
      const profileData = readChangedProfileInputs(originalProfile);

      if (Object.keys(profileData).length === 0) {
        setSubmittingState(saveBtn, false);
        showFormMessage("No changes to save.", "warning");
        return;
      }

      const updated = await updateProfile(profileData);
      const updatedUser = updated?.user ?? updated;

      fillProfileForm(updatedUser);
      originalProfile = updatedUser || originalProfile;

      if (updatedUser?.first_name) {
        localStorage.setItem("aa_user_name", String(updatedUser.first_name));
      }

      showToast({
        container: toastContainer,
        variant: "success",
        message: "Profile saved. Redirecting…",
        autohideMs: 2000,
      });

      setTimeout(() => {
        window.location.replace("/threshold");
      }, 500);
    } catch (err) {
      console.error("Profile update error:", err);
      showFormMessage(err.message || "Profile update failed. Please try again.", "danger");
      setSubmittingState(saveBtn, false);
    }
  });
});

/* -----------------------------
   Toast helper
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
   UI helpers
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
   Prefill + diff helpers
-------------------------------- */

async function fetchMyProfile() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("You’re logged out. Please log in again.");

  const res = await fetch(`${window.API_BASE}/api/user/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.details || data?.error || data?.message || `Profile fetch failed (${res.status})`);
  }

  return data?.user ?? data;
}

function normaliseDateOnly(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function readChangedProfileInputs(original) {
  const current = {
    first_name: document.getElementById("firstName")?.value?.trim() || "",
    last_name: document.getElementById("lastName")?.value?.trim() || "",
    date_of_birth: document.getElementById("dob")?.value || "",
    sex_at_birth: document.getElementById("sexAtBirth")?.value || "",
    gender: document.getElementById("gender")?.value || "",
    nationality: document.getElementById("nationality")?.value?.trim() || "",
  };

  const orig = {
    first_name: (original?.first_name || "").trim(),
    last_name: (original?.last_name || "").trim(),
    date_of_birth: normaliseDateOnly(original?.date_of_birth),
    sex_at_birth: original?.sex_at_birth || "",
    gender: original?.gender || "",
    nationality: (original?.nationality || "").trim(),
  };

  const updates = {};
  for (const key of Object.keys(current)) {
    if (current[key] !== orig[key] && current[key] !== "") {
      updates[key] = current[key];
    }
  }

  return updates;
}

function fillProfileForm(user) {
  if (!user) return;

  const setValue = (id, value) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (value === null || value === undefined) return;
    if (document.activeElement === el) return;

    const next = String(value).trim();
    if (!next) return;

    el.value = next;
  };

  setValue("firstName", user.first_name);
  setValue("lastName", user.last_name);

  const dob = normaliseDateOnly(user.date_of_birth);
  if (dob) setValue("dob", dob);

  setValue("sexAtBirth", user.sex_at_birth);
  setValue("gender", user.gender);
  setValue("nationality", user.nationality);
}

/* -----------------------------
   API call (PATCH)
-------------------------------- */

async function updateProfile(profile) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("You’re logged out. Please log in again.");

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
   Delete profile
-------------------------------- */

function wireDeleteAccount({ openDeleteBtn, deleteModalEl, confirmDeleteBtn, deleteConfirmInput, toastContainer }) {
  if (!openDeleteBtn || !deleteModalEl || !confirmDeleteBtn || !deleteConfirmInput) return;
  if (!window.bootstrap?.Modal) return;

  const modal = new window.bootstrap.Modal(deleteModalEl);

  function resetModal() {
    deleteConfirmInput.value = "";
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = "Permanently delete";
  }

  openDeleteBtn.addEventListener("click", () => {
    resetModal();
    modal.show();
    setTimeout(() => deleteConfirmInput.focus(), 150);
  });

  deleteConfirmInput.addEventListener("input", () => {
    const ok = deleteConfirmInput.value.trim().toUpperCase() === "DELETE";
    confirmDeleteBtn.disabled = !ok;
  });

  confirmDeleteBtn.addEventListener("click", async () => {
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = "Deleting…";

    try {
      await deleteMyAccount();

      localStorage.removeItem("token");
      localStorage.removeItem("aa_user_name");
      localStorage.removeItem("sensitivity_ui");
      localStorage.removeItem("effectiveTriggerAqi");
      localStorage.removeItem("thresholds");

      showToast({
        container: toastContainer,
        variant: "success",
        message: "Your profile has been deleted. Redirecting…",
        autohideMs: 2000,
      });

      modal.hide();

      setTimeout(() => {
        window.location.replace("/signup");
      }, 600);
    } catch (err) {
      console.error("Delete account error:", err);
      showFormMessage(err.message || "Could not delete your profile. Please try again.", "danger");

      confirmDeleteBtn.textContent = "Permanently delete";
      confirmDeleteBtn.disabled = deleteConfirmInput.value.trim().toUpperCase() !== "DELETE";
    }
  });

  deleteModalEl.addEventListener("hidden.bs.modal", resetModal);
}

async function deleteMyAccount() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("You’re logged out. Please log in again.");

  let res;
  try {
    res = await fetch(`${window.API_BASE}/api/user/me`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (_) {
    throw new Error("Unable to reach the server. Please try again.");
  }

  if (res.status === 204) return;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("Your session has expired. Please log in again.");
    }
    throw new Error(data?.error || data?.message || `Delete failed (${res.status})`);
  }
}
