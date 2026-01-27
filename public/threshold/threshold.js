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

  const feedbackEl = document.getElementById("formFeedback");
  const toastContainer = document.querySelector(".toast-container");

  function showInline(message, type = "info") {
    if (!feedbackEl) return;
    feedbackEl.className = `alert alert-${type} mb-3`;
    feedbackEl.textContent = message;
    feedbackEl.classList.remove("d-none");
    feedbackEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function clearInline() {
    if (!feedbackEl) return;
    feedbackEl.classList.add("d-none");
    feedbackEl.textContent = "";
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showToast({ message, variant = "info", title = "AirAware+", autohideMs = 3500 }) {
    if (!toastContainer || !window.bootstrap) return;

    const toastEl = document.createElement("div");
    toastEl.className = `toast align-items-center text-bg-${variant} border-0`;
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");
    toastEl.setAttribute("aria-atomic", "true");

    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <strong class="me-1">${escapeHtml(title)}:</strong> ${escapeHtml(message)}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

    toastContainer.appendChild(toastEl);

    const toast = new window.bootstrap.Toast(toastEl, { delay: autohideMs, autohide: true });
    toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
    toast.show();
  }

  function setSubmitting(isSubmitting) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    submitBtn.disabled = isSubmitting;
    submitBtn.textContent = isSubmitting ? "Saving..." : "Continue";
  }

  /**
   * UI label -> AQI trigger index.
   * Rule: "Alert me when AQI >= triggerAqi"
   */
  const UI_TO_TRIGGER_AQI = {
    "very-sensitive": 2,
    "sensitive": 2,
    "moderate": 3,
    "slight": 4,
    "not-sensitive": 5,
    "unknown": 3,
  };

  const TRIGGER_AQI_TO_API_SENSITIVITY = {
    1: "good",
    2: "fair",
    3: "moderate",
    4: "poor",
    5: "very_poor",
  };

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
    let res = await fetch(`${window.API_BASE}/api/thresholds`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sensitivity: apiSensitivity }),
    });

    if (res.status === 404) {
      res = await fetch(`${window.API_BASE}/api/thresholds`, {
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
     Quiz wiring
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

  function mapScoreToUiValue(score) {
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

  // Clear inline message when interacting
  form.querySelectorAll('input[name="sensitivity"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      clearInline();
      if (radio.value === "unknown" && radio.checked) openQuiz();
    });
  });

  if (openQuizBtn) {
    openQuizBtn.addEventListener("click", (e) => {
      e.preventDefault();
      clearInline();
      if (unknownRadio) unknownRadio.checked = true;
      openQuiz();
    });
  }

  if (closeQuizBtn) closeQuizBtn.addEventListener("click", () => { clearInline(); closeQuiz(); });

  if (backToChoicesBtn) {
    backToChoicesBtn.addEventListener("click", () => {
      clearInline();
      closeQuiz();
      const optionsTop = form.querySelector(".d-grid.gap-3.mt-3");
      if (optionsTop) optionsTop.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (calcBtn) {
    calcBtn.addEventListener("click", () => {
      clearInline();

      const s = getRadioNumber("q_symptoms");
      const f = getRadioNumber("q_frequency");
      const i = getRadioNumber("q_impact");

      if (s === null || f === null || i === null) {
        showInline("Please answer all 3 questions to get a recommendation.", "warning");
        showToast({ variant: "warning", message: "Please answer all quiz questions first." });
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

      showToast({ variant: "success", message: `Recommendation ready: ${uiLabel(recommendedUiValue)}.` });
    });
  }

  if (useRecommendedBtn) {
    useRecommendedBtn.addEventListener("click", () => {
      clearInline();

      if (!recommendedUiValue) {
        showInline("Please click “Get recommendation” first.", "warning");
        return;
      }

      selectSensitivity(recommendedUiValue);
      closeQuiz();
      showToast({ variant: "success", message: `Selected: ${uiLabel(recommendedUiValue)}.` });
    });
  }

  if (useAverageNormalBtn) {
    useAverageNormalBtn.addEventListener("click", () => {
      clearInline();
      selectSensitivity("moderate");
      closeQuiz();
      showToast({ variant: "info", message: "Selected: Moderately sensitive." });
    });
  }

  if (useAverageAsthmaBtn) {
    useAverageAsthmaBtn.addEventListener("click", () => {
      clearInline();
      selectSensitivity("sensitive");
      closeQuiz();
      showToast({ variant: "info", message: "Selected: Sensitive." });
    });
  }

  /* -----------------------------
     Submit
  -------------------------------- */

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearInline();

    let uiValue = getSelectedUiValue();

    // Never save "unknown" — treat it as default moderate unless they used the quiz buttons.
    if (uiValue === "unknown") {
      selectSensitivity("moderate");
      uiValue = getSelectedUiValue();
    }

    if (!uiValue) {
      showInline("Please select a sensitivity level before continuing.", "warning");
      return;
    }

    const triggerAqi = UI_TO_TRIGGER_AQI[uiValue];
    if (!triggerAqi) {
      showInline("That option isn't recognised. Please select another option.", "danger");
      return;
    }

    // Always save locally first
    saveLocally({ uiValue, triggerAqi });

    const token = localStorage.getItem("token");

    // Dev/no-auth mode
    if (!token) {
      showToast({ variant: "success", message: "Saved locally. Continuing to location…" });
      window.location.href = "/location";
      return;
    }

    const apiSensitivity = TRIGGER_AQI_TO_API_SENSITIVITY[triggerAqi] ?? "moderate";

    try {
      setSubmitting(true);

      await saveToApi({ apiSensitivity, token });

      showToast({ variant: "success", message: "Sensitivity saved. Continuing…" });
      window.location.href = "/location";
    } catch (err) {
      console.error(err);

      showInline("Something went wrong while saving your settings. Please try again.", "danger");
      showToast({ variant: "danger", message: "Couldn’t save settings. Please try again." });
      setSubmitting(false);
    }
  });
});