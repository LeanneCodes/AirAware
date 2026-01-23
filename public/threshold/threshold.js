/*
 * Two modes:
 * - No token: save locally and continue (lets you develop without auth fully integrated)
 * - Token present: PATCH /api/thresholds (fallback to POST on 404)
*/

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".sensitivity-form");
  if (!form) {
    console.error("Sensitivity form not found (.sensitivity-form).");
    return;
  }

  /**
   * UI label -> AQI trigger index.
   * "Alert me when AQI >= triggerAqi"
   */
  const UI_TO_TRIGGER_AQI = {
    "very-sensitive": 2,
    "sensitive": 3,
    "moderate": 4,
    "slight": 5,
    "not-sensitive": 5,
    "unknown": 3, // backend default is 3
  };

  /**
   * AQI trigger index -> backend sensitivity string
   */
  const TRIGGER_AQI_TO_API_SENSITIVITY = {
    1: "good",
    2: "fair",
    3: "moderate",
    4: "poor",
    5: "very_poor",
  };

  function getSelectedUiValue() {
    return form.querySelector('input[name="sensitivity"]:checked')?.value ?? null;
  }

  function saveLocally({ uiValue, triggerAqi }) {
    localStorage.setItem("sensitivity_ui", uiValue);
    localStorage.setItem("effectiveTriggerAqi", String(triggerAqi));

    // helper function
    const apiSensitivity = TRIGGER_AQI_TO_API_SENSITIVITY[triggerAqi] ?? "moderate";
    localStorage.setItem("sensitivity_api_preview", apiSensitivity);
  }

  async function saveToApi({ apiSensitivity, token }) {
    let res = await fetch("/api/thresholds", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sensitivity: apiSensitivity }),
    });

    if (res.status === 404) {
      res = await fetch("/api/thresholds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sensitivity: apiSensitivity }),
      });
    }

    if (!res.ok) {
      let details = "";
      try {
        const data = await res.json();
        details = data?.error ? ` (${data.error})` : "";
      } catch (_) {}
      throw new Error(`Failed to save sensitivity: ${res.status}${details}`);
    }

    // Save server-confirmed effectiveTriggerAqi if provided
    try {
      const data = await res.json();
      if (data?.effectiveTriggerAqi != null) {
        localStorage.setItem("effectiveTriggerAqi", String(data.effectiveTriggerAqi));
      }
      if (data?.thresholds) {
        localStorage.setItem("thresholds", JSON.stringify(data.thresholds));
      }
    } catch (_) {}
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const uiValue = getSelectedUiValue();
    if (!uiValue) {
      alert("Please select a sensitivity level before continuing.");
      return;
    }

    const triggerAqi = UI_TO_TRIGGER_AQI[uiValue];
    if (!triggerAqi) {
      alert("That option isn't recognised. Please select another option.");
      return;
    }

    // Always save locally first
    saveLocally({ uiValue, triggerAqi });

    const token = localStorage.getItem("token");

    // Dev/no-auth mode
    if (!token) {
      window.location.href = "/dashboard";
      return;
    }

    // Convert AQI trigger -> backend expected string
    const apiSensitivity =
      uiValue === "unknown"
        ? "unknown"
        : (TRIGGER_AQI_TO_API_SENSITIVITY[triggerAqi] ?? "moderate");

    try {
      await saveToApi({ apiSensitivity, token });
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      alert("Something went wrong while saving your settings. Please try again.");
    }
  });
});
