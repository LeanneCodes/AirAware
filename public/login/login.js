/*
  Login behaviour:
  - Form-level inline messages via #formFeedback (errors)
  - Field-level inline message under password via #passwordError (auth failures)
  - Toast used for success + redirect (top-right under navbar)
  - No alert()
*/

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const loginBtn = document.getElementById("loginBtn");
  const toastContainer = document.getElementById("aaToastContainer");

  if (!form) {
    console.error("Login form not found");
    return;
  }

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  emailInput?.addEventListener("input", () => {
    clearFormMessage();
    clearPasswordError();
  });

  passwordInput?.addEventListener("input", () => {
    clearFormMessage();
    clearPasswordError();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearFormMessage();
    clearPasswordError();
    setSubmittingState(loginBtn, true);

    try {
      const credentials = readCredentials();
      const data = await loginRequest(credentials);

      storeToken(data.token);

      showToast({
        container: toastContainer,
        variant: "success",
        message: "Login successful. Redirecting…",
        autohideMs: 1800,
      });

      setTimeout(() => {
        window.location.href = "/user";
      }, 2000);
    } catch (err) {
      console.error("Login error:", err);

      if (err.message === "Incorrect email or password.") {
        showPasswordError(err.message);
        setSubmittingState(loginBtn, false);
        return;
      }

      showFormMessage(err.message || "Something went wrong. Please try again.", "danger");
      setSubmittingState(loginBtn, false);
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
    buttonEl.textContent = "Logging in…";
  } else {
    buttonEl.textContent = buttonEl.dataset.originalText || "Login";
    delete buttonEl.dataset.originalText;
  }
}

/* -----------------------------
   Validation
-------------------------------- */

function readCredentials() {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const email = emailInput?.value?.trim().toLowerCase() || "";
  const password = passwordInput?.value || "";

  if (!email || !password) {
    throw new Error("Please enter your email and password.");
  }

  return { email, password };
}

/* -----------------------------
   API
-------------------------------- */

async function loginRequest({ email, password }) {
  let res;

  try {
    res = await fetch(`${window.API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (_) {
    throw new Error("Unable to reach the server. Please try again.");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("Incorrect email or password.");
    }
    throw new Error(data?.error || "Unable to log in. Please try again.");
  }

  if (!data.token) {
    throw new Error("Login succeeded but no token was returned.");
  }

  return data;
}

function storeToken(token) {
  localStorage.setItem("token", token);
}
