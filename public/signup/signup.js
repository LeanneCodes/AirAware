/*
  Signup behaviour:
  - Form-level inline messages via #formFeedback
  - Field-level inline message via #passwordError for password rules/mismatch
  - No alert(), no toast
*/

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const signupBtn = document.getElementById("signupBtn");

  if (!form) {
    console.error("Signup form not found");
    return;
  }

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("confirmPassword");

  emailInput?.addEventListener("input", clearPasswordError);
  passwordInput?.addEventListener("input", clearPasswordError);
  confirmInput?.addEventListener("input", clearPasswordError);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearFormMessage();
    clearPasswordError();
    setSubmittingState(signupBtn, true);

    try {
      const credentials = readSignupInputs();
      await registerUser(credentials);

      showFormMessage("Account created successfully. Redirecting you to log in…", "success");

      setTimeout(() => {
        window.location.href = "/login";
      }, 700);
    } catch (err) {
      console.error("Signup error:", err);

      // Password-related errors → field-level message only
      if (
        err.message === "Password must be at least 6 characters." ||
        err.message === "Passwords do not match."
      ) {
        showPasswordError(err.message);
        setSubmittingState(signupBtn, false);
        return;
      }

      // Everything else → form-level message
      showFormMessage(err.message || "Something went wrong. Please try again.", "danger");
      setSubmittingState(signupBtn, false);
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
    res = await fetch("/api/auth/register", {
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
