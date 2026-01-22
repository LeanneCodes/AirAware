document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const submitBtn = form.querySelector("button[type='button']");

  if (!form || !submitBtn) {
    console.error("Signup form or button not found");
    return;
  }

  submitBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    
    if (!email || !password || !confirmPassword) {
      alert("All fields are required.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // These are mandatory for registration but refined later by the user
    const condition_type = "both";
    const sensitivity_level = "medium";

    try {
      const response = await fetch("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          condition_type,
          sensitivity_level,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      
      // Force  thelogin
      alert("Account created successfully. Please log in.");

      window.location.href = "/login.html";

    } catch (error) {
      console.error("Signup error:", error);
      alert(error.message);
    }
  });
});