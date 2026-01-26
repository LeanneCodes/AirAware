/*
  What this file does:
  1) Waits for the page HTML to load
  2) Finds the login <form> and listens for submit
  3) Reads email + password from inputs
  4) Sends POST /api/auth/login with JSON body
  5) If successful, stores the returned token in localStorage
  6) Redirects the user to the homepage
*/

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  // If the form is not on the page, do nothing (but log an error for debugging).
  if (!form) {
    console.error("Login form not found");
    return;
  }

  // Handle submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const credentials = readCredentials();

      const data = await loginRequest(credentials);

      storeToken(data.token);

      // Using window.location.href ensures a full navigation.
      window.location.href = "/user";
    } catch (err) {
      // We show user-friendly messages for expected errors
      // and log the full error for developers.
      console.error("Login error:", err);
      alert(err.message || "Something went wrong. Please try again.");
    }
  });
});

/* -----------------------------
   1) Read + validate inputs
-------------------------------- */

function readCredentials() {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const email = emailInput?.value?.trim().toLowerCase() || "";
  const password = passwordInput?.value || "";

  // Basic validation: both fields must exist.
  if (!email || !password) {
    throw new Error("Please enter your email and password.");
  }

  return { email, password };
}

/* -----------------------------
   2) API call
-------------------------------- */

async function loginRequest({ email, password }) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  // Server might return non-JSON on unexpected errors, so guard it.
  const data = await res.json().catch(() => ({}));

  // If status is not OK, try to show a server-provided message.
  if (!res.ok) {
    throw new Error(data.error || `Login failed (${res.status})`);
  }

  // Token is required for authenticated pages.
  if (!data.token) {
    throw new Error("Login succeeded but no token was returned.");
  }

  return data;
}

/* -----------------------------
   3) Token storage
-------------------------------- */

function storeToken(token) {
  // Your other pages read localStorage.getItem("token"),
  // so we store under the same key for consistency.
  localStorage.setItem("token", token);
}
