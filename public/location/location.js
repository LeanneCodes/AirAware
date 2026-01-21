export function initLocationPage(doc = document, deps = {}) {
  const cityInput = doc.querySelector("#city");
  const postInput = doc.querySelector("#postcode");
  const saveBtn = doc.querySelector("#saveLocation");
  const clearBtn = doc.querySelector("#clearLocation");
  const errorEl = doc.querySelector("#locationError");

  const storage = deps.storage ?? window.localStorage;
  const storageKey = deps.storageKey ?? "airaware_location";

  function setError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.style.display = msg ? "block" : "none";
  }

  function getCity() {
    return (cityInput?.value ?? "").trim();
  }

  function getPostcode() {
    return (postInput?.value ?? "").trim();
  }

 
  function syncDisableState() {
    if (!cityInput || !postInput) return;

    const city = getCity();
    const post = getPostcode();

    if (city && !post) {
      postInput.disabled = true;
      cityInput.disabled = false;
      return;
    }

    if (post && !city) {
      cityInput.disabled = true;
      postInput.disabled = false;
      return;
    }

   
    if (!city && !post) {
      cityInput.disabled = false;
      postInput.disabled = false;
      return;
    }

    cityInput.disabled = false;
    postInput.disabled = false;
  }

  function validate() {
    const city = getCity();
    const post = getPostcode();

    if (!city && !post) {
      setError("Please enter either a city or a postcode.");
      return null;
    }

    if (city && post) {
      setError("Please use only one: city OR postcode.");
      return null;
    }

    setError("");
    return city ? { type: "city", value: city } : { type: "postcode", value: post };
  }

  function loadSaved() {
    if (!cityInput || !postInput) return null;

    try {
      const raw = storage.getItem(storageKey);
      if (!raw) return null;

      const saved = JSON.parse(raw);
      if (saved?.type === "city") {
        cityInput.value = saved.value ?? "";
        postInput.value = "";
      } else if (saved?.type === "postcode") {
        postInput.value = saved.value ?? "";
        cityInput.value = "";
      }

      syncDisableState();
      return saved;
    } catch {
      return null;
    }
  }

  async function onSave(e) {
    e?.preventDefault?.();

    const payload = validate();
    if (!payload) return false;

    storage.setItem(storageKey, JSON.stringify(payload));
    syncDisableState();
    return true;
  }

  function onClear(e) {
    e?.preventDefault?.();

    if (cityInput) cityInput.value = "";
    if (postInput) postInput.value = "";

    storage.removeItem(storageKey);
    setError("");
    syncDisableState();
    return true;
  }

  function onInput() {
    setError("");
    syncDisableState();
  }

  cityInput?.addEventListener("input", onInput);
  postInput?.addEventListener("input", onInput);

  saveBtn?.addEventListener("click", onSave);
  clearBtn?.addEventListener("click", onClear);

  
  const form = cityInput?.closest("form") || postInput?.closest("form");
  form?.addEventListener("submit", onSave);

  
  syncDisableState();
  loadSaved();

  return {
    syncDisableState,
    validate,
    loadSaved,
    onSave,
    onClear,
  };
}
