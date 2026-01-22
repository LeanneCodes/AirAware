document.addEventListener("DOMContentLoaded", () => {
  const cityInput = document.querySelector("#cityInput");
  const postInput = document.querySelector("#postcodeInput");
  const form = document.querySelector("#locationForm");
  const clearBtn = document.querySelector("#clearBtn");
  const successEl = document.querySelector("#saveSuccess");


  const storageKey = "airaware_location";

  if (!cityInput || !postInput || !form || !clearBtn) {
    console.warn("Location page: missing form elements");
    return;
  }

  const getCity = () => cityInput.value.trim();
  const getPostcode = () => postInput.value.trim();

 
  function syncDisableState() {
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

    cityInput.disabled = false;
    postInput.disabled = false;
  }


  function validate() {
    const city = getCity();
    const post = getPostcode();

    if (!city && !post) {
      alert("Please enter either a city or a postcode.");
      return null;
    }

    if (city && post) {
      alert("Please use only one: city OR postcode.");
      return null;
    }

    return city
      ? { type: "city", value: city }
      : { type: "postcode", value: post };
  }

 
  function onInput() {
    syncDisableState();
  }

  function onSubmit(e) {
    e.preventDefault();

    const payload = validate();
    if (!payload) return;

    localStorage.setItem(storageKey, JSON.stringify(payload));
    syncDisableState();
    if (successEl) {
    successEl.style.display = "block";
    successEl.textContent = "Location saved successfully.";
  }
  }

  function onClear() {
    cityInput.value = "";
    postInput.value = "";
    localStorage.removeItem(storageKey);
    syncDisableState();
  }

  cityInput.addEventListener("input", onInput);
  postInput.addEventListener("input", onInput);
  form.addEventListener("submit", onSubmit);
  clearBtn.addEventListener("click", onClear);

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved?.type === "city") {
      cityInput.value = saved.value || "";
    }
    if (saved?.type === "postcode") {
      postInput.value = saved.value || "";
    }
  } catch {}

  syncDisableState();
});
