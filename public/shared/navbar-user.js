(() => {
  const el = document.getElementById("welcomeUserName");
  if (!el) return;

  const TOKEN_KEY = "token";
  const NAME_KEY = "aa_user_name";

  // 1) Render instantly from cache (prevents "User" flash)
  const cachedName = localStorage.getItem(NAME_KEY);
  if (cachedName) {
    el.textContent = cachedName;
  } else {
    if (!el.textContent || el.textContent.trim() === "User") el.textContent = "there";
  }

  // 2) If not logged in, stop here
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;

  // 3) Fetch the real name from the DB via our existing endpoint
  fetch(`${window.API_BASE}/api/user/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `User fetch failed (${res.status})`);
      return data;
    })
    .then((data) => {
      const user = data?.user ?? data;

      const name =
        user?.first_name ||
        user?.name ||
        (user?.email ? String(user.email).split("@")[0] : null);

      if (!name) return;

      // Only update if different (avoids flicker)
      if (el.textContent !== name) el.textContent = name;

      // Cache for next page load
      localStorage.setItem(NAME_KEY, name);
    })
    .catch(() => {
      // silent: keep cached name and avoid UI flash
    });
})();