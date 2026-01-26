document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".formGrid");
  const saveBtn = document.getElementById("saveProfileBtn");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearFormMessage();
    setSubmittingState(saveBtn, true);

    try {
      const profileData = readProfileInputs();
      await updateProfile(profileData);

      showFormMessage("Profile saved. Redirecting…", "success");

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
   UI helpers (inline feedback)
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
    // This is not a form validation issue — user needs to log in again.
    throw new Error("You’re logged out. Please log in again.");
  }

  let res;
  try {
    res = await fetch("/api/user/me", {
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
    throw new Error(data?.error || "Profile update failed.");
  }

  return data;
}
