/*
 * Two modes:
 * - No token: save locally and continue (lets you develop without auth fully integrated)
 * - Token present: PATCH /api/thresholds (fallback to POST on 404)
 *
 */

document.addEventListener("DOMContentLoaded", () => {
  loadNavbarUser();
  const form = document.querySelector(".sensitivity-form");
  if (!form) {
    console.error("Sensitivity form not found (.sensitivity-form).");
    return;
  }

  /**
   * UI label -> AQI trigger index.
   * Rule: "Alert me when AQI >= triggerAqi"
   *
   * We avoid trigger=1 for user settings because that would effectively mean
   * "alerts even when AQI is Good", which is confusing/unhelpful.
   */
const UI_TO_TRIGGER_AQI = {
  "very-sensitive": 2,
  "sensitive": 2,
  "moderate": 3,
  "slight": 4,
  "not-sensitive": 5,
  "unknown": 3, // default to moderate
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

  /**
   * AQI trigger index -> label (for explanations)
   */
  const TRIGGER_AQI_TO_LABEL = {
    1: "Good",
    2: "Fair",
    3: "Moderate",
    4: "Poor",
    5: "Very Poor",
  };

  function getSelectedUiValue() {
    return form.querySelector('input[name="sensitivity"]:checked')?.value ?? null;
  }

  function saveLocally({ uiValue, triggerAqi }) {
    localStorage.setItem("sensitivity_ui", uiValue);
    localStorage.setItem("effectiveTriggerAqi", String(triggerAqi));

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

  /* -----------------------------
     Quiz wiring (only if IDs exist)
  -------------------------------- */

  const unknownRadio = form.querySelector('input[name="sensitivity"][value="unknown"]');

  const quizSection = document.getElementById("quizSection");
  const openQuizBtn = document.getElementById("openQuizBtn");
  const closeQuizBtn = document.getElementById("closeQuizBtn");
  const backToChoicesBtn = document.getElementById("backToChoicesBtn");

  const calcBtn = document.getElementById("calcBtn");
  const quizResult = document.getElementById("quizResult");
  const resultExplain = document.getElementById("resultExplain");

  const useRecommendedBtn = document.getElementById("useRecommendedBtn");
  const useAverageNormalBtn = document.getElementById("useAverageNormalBtn");
  const useAverageAsthmaBtn = document.getElementById("useAverageAsthmaBtn");

  let recommendedUiValue = null;

  function openQuiz() {
    if (!quizSection) return;
    quizSection.classList.add("is-open");
    quizSection.setAttribute("aria-hidden", "false");
    quizSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeQuiz() {
    if (!quizSection) return;
    quizSection.classList.remove("is-open");
    quizSection.setAttribute("aria-hidden", "true");
  }

  function selectSensitivity(uiValue) {
    const target = form.querySelector(`input[name="sensitivity"][value="${uiValue}"]`);
    if (target) {
      target.checked = true;
      target.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function getRadioNumber(name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected ? Number(selected.value) : null;
  }

  // Score: 0–9
  function mapScoreToUiValue(score) {
    // Keeps it simple and consistent with the 5 choices
    if (score <= 1) return "not-sensitive";
    if (score <= 3) return "slight";
    if (score <= 5) return "moderate";
    if (score <= 7) return "sensitive";
    return "very-sensitive";
  }

  function uiLabel(value) {
    switch (value) {
      case "very-sensitive": return "Very sensitive";
      case "sensitive": return "Sensitive";
      case "moderate": return "Moderately sensitive";
      case "slight": return "Slightly sensitive";
      case "not-sensitive": return "Not sensitive";
      default: return value;
    }
  }

  function uiToTriggerExplain(uiValue) {
    const trigger = UI_TO_TRIGGER_AQI[uiValue] ?? 3;
    const band = TRIGGER_AQI_TO_LABEL[trigger] ?? "Moderate";
    return `Alerts at ${band} or worse.`;
  }

  // 1) When user selects "unknown", reveal the quiz automatically
  form.querySelectorAll('input[name="sensitivity"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.value === "unknown" && radio.checked) openQuiz();
    });
  });

  // 2) Button inside the "I don’t know" card (if you added it)
  if (openQuizBtn) {
    openQuizBtn.addEventListener("click", () => {
      if (unknownRadio) unknownRadio.checked = true;
      openQuiz();
    });
  }

  if (closeQuizBtn) closeQuizBtn.addEventListener("click", closeQuiz);

  if (backToChoicesBtn) {
    backToChoicesBtn.addEventListener("click", () => {
      closeQuiz();
      const optionsTop = form.querySelector(".d-grid.gap-3.mt-3");
      if (optionsTop) optionsTop.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // 3) Calculate recommendation
  if (calcBtn) {
    calcBtn.addEventListener("click", () => {
      const s = getRadioNumber("q_symptoms");
      const f = getRadioNumber("q_frequency");
      const i = getRadioNumber("q_impact");

      if (s === null || f === null || i === null) {
        alert("Please answer all 3 questions to get a recommendation.");
        return;
      }

      const score = s + f + i;
      recommendedUiValue = mapScoreToUiValue(score);

      if (quizResult) quizResult.hidden = false;

      if (resultExplain) {
        resultExplain.textContent =
          `Based on your answers, we recommend: ${uiLabel(recommendedUiValue)} (score ${score}/9). ` +
          `${uiToTriggerExplain(recommendedUiValue)} ` +
          `You can use this recommendation or choose a default.`;
      }
    });
  }

  // 4) Apply recommended / defaults
  if (useRecommendedBtn) {
    useRecommendedBtn.addEventListener("click", () => {
      if (!recommendedUiValue) {
        alert("Please click “Get recommendation” first.");
        return;
      }
      selectSensitivity(recommendedUiValue);
      closeQuiz();
    });
  }

  // Default average normal -> moderate
  if (useAverageNormalBtn) {
    useAverageNormalBtn.addEventListener("click", () => {
      selectSensitivity("moderate");
      closeQuiz();
    });
  }

  // Default average asthma -> sensitive (one step earlier alerts than average)
  if (useAverageAsthmaBtn) {
    useAverageAsthmaBtn.addEventListener("click", () => {
      selectSensitivity("sensitive");
      closeQuiz();
    });
  }

  /* -----------------------------
     Submit
  -------------------------------- */

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    let uiValue = getSelectedUiValue();

    // Never save "unknown" — treat it as default moderate unless they used the quiz buttons.
    if (uiValue === "unknown") {
      selectSensitivity("moderate");
      uiValue = getSelectedUiValue();
    }

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
      TRIGGER_AQI_TO_API_SENSITIVITY[triggerAqi] ?? "moderate";

    try {
      await saveToApi({ apiSensitivity, token });
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      alert("Something went wrong while saving your settings. Please try again.");
    }
  });
});

async function loadNavbarUser() {
  const el = document.getElementById("welcomeUserName");
  if (!el) return;

  const token = localStorage.getItem("token");
  if (!token) {
    el.textContent = "Guest";
    return;
  }

  try {
    const res = await fetch("/api/dashboard", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      el.textContent = "User";
      return;
    }

    const payload = await res.json();
    const user = payload.user;

    el.textContent =
      user?.first_name ||
      (user?.email ? String(user.email).split("@")[0] : null) ||
      "User";
  } catch {
    el.textContent = "User";
  }
}