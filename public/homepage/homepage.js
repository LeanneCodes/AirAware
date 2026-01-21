export function initHomepage(doc = document, deps = {}) {
  const storage = deps.storage ?? window.localStorage;
  const profileKey = deps.profileKey ?? "airaware_profile";

  function getSavedProfile() {
    try {
      const raw = storage.getItem(profileKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setWelcomeName() {
    const profile = getSavedProfile();
    const name =
      profile?.firstName?.trim() ||
      profile?.lastName?.trim() ||
      "User";

    const chips = Array.from(doc.querySelectorAll(".chip"));
    const welcomeChip = chips.find((el) =>
      (el.textContent || "").toLowerCase().includes("welcome")
    );

    if (welcomeChip) welcomeChip.textContent = `Welcome, ${name}!`;
  }

  setWelcomeName();

  return { setWelcomeName, getSavedProfile };
}


