/*
  Signup behaviour:
  - Form-level inline messages via #formFeedback (errors)
  - Field-level inline message via #passwordError for password rules/mismatch
  - Toast used for success + redirecting (top-right under navbar)
  - No alert()
*/

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const signupBtn = document.getElementById("signupBtn");
  const toastContainer = document.getElementById("aaToastContainer");

  if (!form) {
    console.error("Signup form not found");
    return;
  }

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("confirmPassword");

  emailInput?.addEventListener("input", () => {
    clearFormMessage();
    clearPasswordError();
  });
  passwordInput?.addEventListener("input", () => {
    clearFormMessage();
    clearPasswordError();
  });
  confirmInput?.addEventListener("input", () => {
    clearFormMessage();
    clearPasswordError();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearFormMessage();
    clearPasswordError();
    setSubmittingState(signupBtn, true);

    try {
      const credentials = readSignupInputs();
      await registerUser(credentials);

      showToast({
        container: toastContainer,
        variant: "success",
        message: "Account created. Redirecting to log in…",
        autohideMs: 2000,
      });

      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (err) {
      console.error("Signup error:", err);

      if (
        err.message === "Password must be at least 6 characters." ||
        err.message === "Passwords do not match."
      ) {
        showPasswordError(err.message);
        setSubmittingState(signupBtn, false);
        return;
      }

      showFormMessage(err.message || "Something went wrong. Please try again.", "danger");
      setSubmittingState(signupBtn, false);
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
   UI helpers
-------------------------------- */

function showFormMessage(message, type = "danger") {
  const el = document.getElementById("formFeedback");
  if (!el) return;

  el.textContent = message;
  el.className = `alert alert-${type}`;
  el.classList.remove("d-none");
}

function clearFormMessage() {
  const el = document.getElementById("formFeedback");
  if (!el) return;

  el.classList.add("d-none");
  el.textContent = "";
}

function showPasswordError(message) {
  const el = document.getElementById("passwordError");
  if (!el) return;

  el.textContent = message;
  el.style.display = "block";
}

function clearPasswordError() {
  const el = document.getElementById("passwordError");
  if (!el) return;

  el.textContent = "";
  el.style.display = "none";
}

function setSubmittingState(buttonEl, isSubmitting) {
  if (!buttonEl) return;

  buttonEl.disabled = isSubmitting;
  buttonEl.setAttribute("aria-busy", String(isSubmitting));

  if (isSubmitting) {
    buttonEl.dataset.originalText = buttonEl.textContent;
    buttonEl.textContent = "Creating account…";
  } else {
    buttonEl.textContent = buttonEl.dataset.originalText || "Create account";
    delete buttonEl.dataset.originalText;
  }
}

/* -----------------------------
   Validation
-------------------------------- */

function readSignupInputs() {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("confirmPassword");

  const email = emailInput?.value?.trim().toLowerCase() || "";
  const password = passwordInput?.value || "";
  const confirmPassword = confirmInput?.value || "";

  if (!email || !password || !confirmPassword) {
    throw new Error("Please fill in all fields.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  return { email, password };
}

/* -----------------------------
   API
-------------------------------- */

async function registerUser({ email, password }) {
  let res;

  try {
    res = await fetch(`${window.API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (_) {
    throw new Error("Unable to reach the server. Please try again.");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || "Registration failed.");
  }

  return data;
}
