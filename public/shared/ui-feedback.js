(() => {
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getToastContainer() {
    return document.getElementById("aaToastContainer") || document.querySelector(".toast-container");
  }

  function showToast({
    title = "AirAware+",
    message,
    variant = "info", // info | success | warning | danger
    autohideMs = 3200,
  }) {
    const container = getToastContainer();
    if (!container || !window.bootstrap?.Toast) {
      // Fallback: no bootstrap toast available
      console.warn("Toast container or Bootstrap Toast not available:", message);
      return;
    }

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
        <button type="button" class="btn-close btn-close-white me-2 m-auto"
          data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

    container.appendChild(toastEl);

    const toast = new window.bootstrap.Toast(toastEl, {
      delay: autohideMs,
      autohide: true,
    });

    toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
    toast.show();
  }

  function showInline(feedbackEl, message, type = "info") {
    if (!feedbackEl) return;
    feedbackEl.className = `alert alert-${type} mb-3`;
    feedbackEl.textContent = message;
    feedbackEl.classList.remove("d-none");
  }

  function clearInline(feedbackEl) {
    if (!feedbackEl) return;
    feedbackEl.classList.add("d-none");
    feedbackEl.textContent = "";
  }

  // Expose globally (simple vanilla approach)
  window.AAUI = {
    showToast,
    showInline,
    clearInline,
  };
})();
