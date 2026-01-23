document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const passwordError = document.getElementById("passwordError");

  function showError(message) {
    passwordError.textContent = message;
    passwordError.style.display = "block";
  }

  function clearError() {
    passwordError.textContent = "";
    passwordError.style.display = "none";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    
    if (!email || !password || !confirmPassword) {
      return showError("All fields are required.");
    }

    if (password.length < 6) {
      return showError("Password must be at least 6 characters.");
    }

    if (password !== confirmPassword) {
      return showError("Passwords do not match.");
    }

    try {
      const res = await fetch("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        
        return showError(data.error || "Registration failed.");
      }

      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("SIGNUP_ERROR", err);
      showError("Something went wrong. Please try again.");
    }
  });
});
