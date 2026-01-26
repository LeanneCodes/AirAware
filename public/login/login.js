/*
  Login behaviour:
  - Form-level inline messages via #formFeedback
  - Field-level inline message under password via #passwordError
  - No alert(), no toast
*/

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const loginBtn = document.getElementById("loginBtn");

  if (!form) {
    console.error("Login form not found");
    return;
  }

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  emailInput?.addEventListener("input", clearPasswordError);
  passwordInput?.addEventListener("input", clearPasswordError);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearFormMessage();
    clearPasswordError();
    setSubmittingState(loginBtn, true);

    try {
      const credentials = readCredentials();
      const data = await loginRequest(credentials);

      storeToken(data.token);

      showFormMessage("Login successful. Redirecting…", "success");

      setTimeout(() => {
        window.location.href = "/user";
      }, 400);
    } catch (err) {
      console.error("Login error:", err);

      // Auth error → field-level message only
      if (err.message === "Incorrect email or password.") {
        showPasswordError(err.message);
        setSubmittingState(loginBtn, false);
        return;
      }

      // Everything else → form-level message
      showFormMessage(err.message || "Something went wrong. Please try again.", "danger");
      setSubmittingState(loginBtn, false);
    }
  });
});

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
    res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (_) {
    throw new Error("Unable to reach the server. Please try again.");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Normalise auth failures to a single calm message
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
