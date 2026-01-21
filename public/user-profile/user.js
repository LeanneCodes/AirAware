export function initUserProfilePage(doc = document, deps = {}) {
  const storage = deps.storage ?? window.localStorage;
  const storageKey = deps.storageKey ?? "airaware_profile";

  const form = doc.querySelector(".formGrid");
  const firstName = doc.querySelector("#firstName");
  const lastName = doc.querySelector("#lastName");
  const dob = doc.querySelector("#dob");
  const sexAtBirth = doc.querySelector("#sexAtBirth");
  const gender = doc.querySelector("#gender");
  const nationality = doc.querySelector("#nationality");

  const errorEl = doc.querySelector("#profileError"); 

  function setError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.style.display = msg ? "block" : "none";
  }

  function getProfile() {
    return {
      firstName: (firstName?.value ?? "").trim(),
      lastName: (lastName?.value ?? "").trim(),
      dob: (dob?.value ?? "").trim(),
      sexAtBirth: (sexAtBirth?.value ?? "").trim(),
      gender: (gender?.value ?? "").trim(),
      nationality: (nationality?.value ?? "").trim(),
    };
  }

  function validate(profile) {
    if (!profile.firstName && !profile.lastName) {
      setError("Please enter at least your first name or last name.");
      return false;
    }
    setError("");
    return true;
  }

  function loadProfile() {
    try {
      const raw = storage.getItem(storageKey);
      if (!raw) return null;
      const data = JSON.parse(raw);

      if (firstName) firstName.value = data.firstName ?? "";
      if (lastName) lastName.value = data.lastName ?? "";
      if (dob) dob.value = data.dob ?? "";
      if (sexAtBirth) sexAtBirth.value = data.sexAtBirth ?? "";
      if (gender) gender.value = data.gender ?? "";
      if (nationality) nationality.value = data.nationality ?? "";

      return data;
    } catch {
      return null;
    }
  }

  function saveProfile(profile) {
    storage.setItem(storageKey, JSON.stringify(profile));
    return true;
  }

  function onSubmit(e) {
    e?.preventDefault?.();

    const profile = getProfile();
    if (!validate(profile)) return false;

    saveProfile(profile);
    return true;
  }

  form?.addEventListener("submit", onSubmit);

  loadProfile();

  return {
    getProfile,
    validate,
    loadProfile,
    saveProfile,
    onSubmit,
  };
}
