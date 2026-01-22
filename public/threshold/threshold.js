document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".sensitivity-form");

  if (!form) {
    console.error("Sensitivity form not found");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const selected = form.querySelector('input[name="sensitivity"]:checked');

    if (!selected) {
      alert("Please select a sensitivity level before continuing.");
      return;
    }

    const sensitivity = selected.value;

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("You must be logged in to save your preferences.");
        window.location.href = "/login.html";
        return;
      }

      const response = await fetch("/threshold", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ sensitivity }),
      });

      if (!response.ok) {
        throw new Error("Failed to save sensitivity");
      }
      
      window.location.href = "/dashboard.html";

    } catch (error) {
      console.error("Error saving sensitivity:", error);
      alert("Something went wrong while saving your settings. Please try again.");
    }
  });
});