(() => {
  const el = document.getElementById("welcomeUserName");
  if (!el) return;

  // ---- Keys
  const TOKEN_KEY = "token";
  const NAME_KEY = "aa_user_name";

  // ---- Helpers
  const setName = (name) => {
    // Avoid changing layout if we don't have a real name yet
    if (!name) return;
    if (el.textContent !== name) el.textContent = name;
  };

  const getCachedName = () => {
    try {
      return localStorage.getItem(NAME_KEY);
    } catch {
      return null;
    }
  };

  const cacheName = (name) => {
    if (!name) return;
    try {
      localStorage.setItem(NAME_KEY, name);
    } catch {
      // ignore storage issues (private browsing etc.)
    }
  };

  const deriveName = (user) => {
    if (!user) return null;

    const first = typeof user.first_name === "string" ? user.first_name.trim() : "";
    if (first) return first;

    const alt = typeof user.name === "string" ? user.name.trim() : "";
    if (alt) return alt;

    const email = typeof user.email === "string" ? user.email : "";
    if (email.includes("@")) return email.split("@")[0];

    return null;
  };

  // 1) Paint instantly from cache (prevents flash)
  const cachedName = getCachedName();
  if (cachedName) {
    setName(cachedName);
  } else {
    // Optional: leave blank to avoid width-jump, or use "there" if you prefer
    // el.textContent = "there";
    if (!el.textContent || el.textContent.trim().toLowerCase() === "user") {
      el.textContent = "";
    }
  }

  // 2) If not logged in, stop (keep cached name if present)
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;

  // 3) Fetch the real name from the DB via your existing endpoint
  // Guard: if config.js wasn't loaded, don't break the page
  if (!window.API_BASE) return;

  fetch(`${window.API_BASE}/api/user/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `User fetch failed (${res.status})`);
      return data;
    })
    .then((data) => {
      // Support common response shapes:
      // - { user: {...} }
      // - { ...userFields }
      const user = data?.user ?? data;

      const name = deriveName(user);
      if (!name) return;

      // Update DOM + cache only if changed
      setName(name);
      cacheName(name);
    })
    .catch(() => {
      // Silent fail: keep cached name and avoid UI flicker
    });
})();
