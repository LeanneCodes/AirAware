document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirm-password");

  form.addEventListener("submit", (e) => {
    if (password.value !== confirmPassword.value) {
      e.preventDefault();
      alert("Passwords do not match");
      confirmPassword.focus();
      return;
    }

    if (password.value.length < 8) {
      e.preventDefault();
      alert("Password must be at least 8 characters long");
      password.focus();
      return;
    }
  });
})