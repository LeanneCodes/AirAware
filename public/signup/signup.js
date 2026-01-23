/*
  What this file does:
  1) Waits for the page HTML to load
  2) Finds the signup <form> and listens for submit
  3) Reads email, password, and confirm password inputs
  4) Runs basic client-side validation
  5) Sends POST /api/auth/register to create an account
  6) On success, redirects the user to the login page
*/

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  // If the form is not found, there is nothing to initialise.
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const credentials = readSignupInputs();

      await registerUser(credentials);

      // Registration succeeded, guide user to login page.
      alert("Account created successfully. Please log in.");
      window.location.href = "/login";
    } catch (err) {
      console.error("Signup error:", err);
      alert(err.message || "Something went wrong. Please try again.");
    }
  });
});

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
