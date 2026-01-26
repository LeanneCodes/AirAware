

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".formGrid");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const profileData = readProfileInputs();
      await updateProfile(profileData);
      alert("Profile updated successfully.");
      window.location.href = "/threshold";
    } catch (err) {
      console.error("Profile update error:", err);
      alert(err.message || "Profile update failed.");
    }
  });
});



function readProfileInputs() {
  const raw = {
    first_name: document.getElementById("firstName")?.value,
    last_name: document.getElementById("lastName")?.value,
    date_of_birth: document.getElementById("dob")?.value,
    sex_at_birth: document.getElementById("sexAtBirth")?.value,
    gender: document.getElementById("gender")?.value,
    nationality: document.getElementById("nationality")?.value,
  };

  
  const cleaned = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value !== null && value !== "") {
      cleaned[key] = value;
    }
  }

  return cleaned;
}



async function updateProfile(profile) {
  console.log("Profile payload being sent:", profile);

  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("You are not logged in.");
  }

  const res = await fetch("/api/user/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(profile),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Profile update failed.");
  }

  return data;
}