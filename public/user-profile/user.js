// document.addEventListener("DOMContentLoaded", () => {
//   const token = localStorage.getItem("token");
//   if (!token) {
//     window.location.href = "/login";
//     return;
//   }

//   const form = document.querySelector(".formGrid");

//   const sexAtBirth = document.getElementById("sexAtBirth");
//   const dob = document.getElementById("dob");
//   const gender = document.getElementById("gender");
//   const nationality = document.getElementById("nationality");

//   async function loadProfile() {
//     const res = await fetch("/api/user/me", {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     const data = await res.json();
//     if (!res.ok) return;

//     const u = data.user;
//     if (sexAtBirth) sexAtBirth.value = u.condition_type || "";
//     if (gender) gender.value = u.sensitivity_level || "";
//     if (dob && u.accepted_disclaimer_at) {
//       dob.value = new Date(u.accepted_disclaimer_at).toISOString().split("T")[0];
//     }
//     if (nationality) nationality.value = u.analytics_opt_in ? "yes" : "no";
//   }

//   async function saveProfile(e) {
//     e.preventDefault();

//     const payload = {
//       condition_type: sexAtBirth?.value?.toLowerCase() || undefined,
//       sensitivity_level: gender?.value?.toLowerCase() || undefined,
//       analytics_opt_in: nationality?.value?.toLowerCase() === "yes",
//       accepted_disclaimer_at: dob?.value ? new Date(dob.value).toISOString() : null,
//     };

//     const res = await fetch("/api/user/me", {
//       method: "PATCH",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(payload),
//     });

//     const data = await res.json();
//     if (!res.ok) {
//       alert(data.error || "Failed to save profile");
//       return;
//     }

//     alert("Profile saved successfully");
//   }

//   form.addEventListener("submit", saveProfile);
//   loadProfile();
// });
