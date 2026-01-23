document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  if (!form) {
    console.error("Login form not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email")?.value?.trim().toLowerCase() || "";
    const password = document.getElementById("password")?.value || "";

    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || `Login failed (${res.status})`);
        return;
      }

      if (!data.token) {
        alert("Login succeeded but no token was returned.");
        return;
      }

      localStorage.setItem("token", data.token);

      window.location.href = "/";
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong. Please try again.");
    }
  });
});
