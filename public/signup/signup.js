document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email")?.value?.trim().toLowerCase() || "";
    const password = document.getElementById("password")?.value || "";
    const confirmPassword = document.getElementById("confirmPassword")?.value || "";

    if (!email || !password || !confirmPassword) {
      return showError("Please fill in all fields.");
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      return showError("Passwords do not match.");
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || "Registration failed.");
        return;
      }

      alert("Account created successfully. Please log in.");
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    }
  });
});
;
