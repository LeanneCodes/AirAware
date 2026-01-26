/*
  What this file does:
  1) Waits for the page HTML to load
  2) Finds the signup <form> and listens for submit
  3) Reads email, password, and confirm password inputs
  4) Runs basic client-side validation
  5) Sends POST /api/auth/register to create an account
  6) On success, shows inline success message and redirects to login
*/

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const signupBtn = document.getElementById("signupBtn");

  if (!form) {
    console.error("Signup form not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearFormMessage();
    clearPasswordError();

    // Prevent double submits
    setSubmittingState(signupBtn, true);

    try {
      const credentials = readSignupInputs();

      await registerUser(credentials);

      // Inline success message (no alert)
      showFormMessage("Account created successfully. Redirecting you to log in…", "success");

      // Small delay so the user can see the message
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (err) {
      console.error("Signup error:", err);

      // Field-specific error → inline only
      if (err.message === "Passwords do not match.") {
        showPasswordError(err.message);
        setSubmittingState(signupBtn, false);
        return;
      }

      // All other errors → form-level message
      showFormMessage(err.message || "Something went wrong. Please try again.", "danger");
      setSubmittingState(signupBtn, false);
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

  // Bootstrap alert types: success, danger, warning, info
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
   1) Read + validate inputs
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

  // Basic password rules for UX (backend enforces real rules).
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  return { email, password };
}

/* -----------------------------
   2) API call
-------------------------------- */

async function registerUser({ email, password }) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  // Backend might return non-JSON if something goes wrong.
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Registration failed.");
  }

  return data;
}
