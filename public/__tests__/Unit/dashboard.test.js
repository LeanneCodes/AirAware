/**
 * @jest-environment jsdom
 */

const fs = require("fs");
const path = require("path");

function loadHtml() {
  const htmlPath = path.join(__dirname, "..", "..", "dashboard.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  document.documentElement.innerHTML = html;
}

describe("Dashboard page (public/dashboard.html)", () => {
  beforeEach(() => {
    loadHtml();
  });

  test("has correct title", () => {
    const titleEl = document.querySelector("title");
    expect(titleEl).not.toBeNull();
    expect(titleEl.textContent).toBe("AirAware+ | Dashboard");
  });

  test("loads dashboard stylesheet", () => {
    const link = document.querySelector(
      'link[rel="stylesheet"][href="/dashboard/style.css"]'
    );
    expect(link).not.toBeNull();
  });

  test("navbar has brand link, nav links, welcome text, and profile button", () => {
    // Brand link + logo
    const brandLink = document.querySelector('a.navbar-brand[aria-label="AirAware+ Home"][href="/"]');
    expect(brandLink).not.toBeNull();

    const brandLogo = document.querySelector('a.navbar-brand img[alt="AirAware+"]');
    expect(brandLogo).not.toBeNull();
    expect(brandLogo.getAttribute("src")).toBe("/assets/airaware-logo-no-whitespace.png");

    // Nav links
    expect(document.querySelector('a.nav-link[href="/"]')?.textContent.trim()).toBe("Home");
    expect(document.querySelector('a.nav-link.active[href="/dashboard"]')?.textContent.trim()).toBe("Dashboard");
    expect(document.querySelector('a.nav-link[href="/threshold"]')?.textContent.trim()).toBe("Sensitivity");
    expect(document.querySelector('a.nav-link[href="/location"]')?.textContent.trim()).toBe("Location");

    // Welcome text + username span
    const welcomeText = document.querySelector(".welcome-text");
    expect(welcomeText).not.toBeNull();
    expect(welcomeText.textContent).toMatch(/Welcome,/i);

    const welcomeUserName = document.getElementById("welcomeUserName");
    expect(welcomeUserName).not.toBeNull();

    // Profile button (link)
    const profileLink = document.querySelector('a[aria-label="Profile"][href="/user"]');
    expect(profileLink).not.toBeNull();
  });

  test("disclaimer exists and is non-medical", () => {
    const disclaimer = document.querySelector(".bg-white.border-bottom p");
    expect(disclaimer).not.toBeNull();
    expect(disclaimer.textContent).toMatch(/not a medical tool/i);
  });

  test("risk bar exists and has live region + riskText", () => {
    const riskbar = document.querySelector('.riskbar[role="status"][aria-live="polite"]');
    expect(riskbar).not.toBeNull();

    const riskText = document.getElementById("riskText");
    expect(riskText).not.toBeNull();
    expect(riskText.textContent).toMatch(/Risk/i);
  });

  test("top row info pill exists with expected IDs", () => {
    const infoPill = document.getElementById("infoPill");
    expect(infoPill).not.toBeNull();

    expect(document.getElementById("locationName")).not.toBeNull();
    expect(document.getElementById("currentDateTime")).not.toBeNull();
    expect(document.getElementById("overallAQ")).not.toBeNull();
    expect(document.getElementById("aqMeterFill")).not.toBeNull();
  });

  test("refresh button exists", () => {
    const refreshBtn = document.getElementById("refreshBtn");
    expect(refreshBtn).not.toBeNull();
    expect(refreshBtn.tagName).toBe("BUTTON");
    expect(refreshBtn.getAttribute("aria-label")).toBe("Refresh data");
  });

  test("renders pollutant cards with expected IDs (pm25, pm10, so2, no2, o3, co)", () => {
    const cards = [...document.querySelectorAll(".pollCard")];
    expect(cards.length).toBeGreaterThanOrEqual(6);

    const pollutants = ["pm25", "pm10", "so2", "no2", "o3", "co"];

    pollutants.forEach((p) => {
      expect(document.querySelector(`.pollCard[data-pollutant="${p}"]`)).not.toBeNull();
      expect(document.getElementById(`${p}Value`)).not.toBeNull();
      expect(document.getElementById(`${p}Status`)).not.toBeNull();
    });
  });

  test("each pollutant has an info icon with bootstrap tooltip attributes", () => {
    const infoIcons = [...document.querySelectorAll(".pollInfo[data-bs-toggle='tooltip']")];
    expect(infoIcons.length).toBeGreaterThanOrEqual(6);

    infoIcons.forEach((el) => {
      expect(el.getAttribute("data-bs-placement")).toBeTruthy();
      expect(el.getAttribute("title")).toBeTruthy();
      // we set data-bs-html="true" in the markup
      expect(el.getAttribute("data-bs-html")).toBe("true");
    });
  });

  test("recommendations panel exists", () => {
    const recommendations = document.getElementById("recommendations");
    expect(recommendations).not.toBeNull();
    expect(recommendations.textContent).toMatch(/NHS recommendations/i);
  });

  test("saved searches container exists and has active search + list", () => {
    const activeBtn = document.getElementById("activeSearchBtn");
    expect(activeBtn).not.toBeNull();

    const activeName = document.getElementById("activeSearchName");
    expect(activeName).not.toBeNull();

    const savedSearches = document.getElementById("savedSearches");
    expect(savedSearches).not.toBeNull();

    // Should have some buttons in the list
    const savedButtons = [...savedSearches.querySelectorAll("button.aa-btn-ghost")];
    expect(savedButtons.length).toBeGreaterThan(0);
  });

  test("recent alerts panel exists", () => {
    const recentAlerts = document.getElementById("recentAlerts");
    expect(recentAlerts).not.toBeNull();
    expect(recentAlerts.textContent).toMatch(/xxxx/i); // matches your placeholder content
  });

  test("trends section and charts grid exist", () => {
    const chartsGrid = document.getElementById("chartsGrid");
    expect(chartsGrid).not.toBeNull();

    const placeholders = [...chartsGrid.querySelectorAll(".chart-placeholder")];
    expect(placeholders).toHaveLength(3);
  });

  test("footer exists with privacy/terms/accessibility links", () => {
    expect(document.querySelector('a.footer-link[href="/privacy"]')).not.toBeNull();
    expect(document.querySelector('a.footer-link[href="/terms"]')).not.toBeNull();
    expect(document.querySelector('a.footer-link[href="/accessibility"]')).not.toBeNull();

    const copyright = document.querySelector("footer");
    expect(copyright).not.toBeNull();
    expect(copyright.textContent).toMatch(/©\s*2026\s*AirAware\+/i);
  });

  test("loads dashboard script with defer", () => {
    const script = document.querySelector('script[src="/dashboard/dashboard.js"]');
    expect(script).not.toBeNull();
    expect(script.hasAttribute("defer")).toBe(true);
  });

  test("loads bootstrap bundle script", () => {
    const bootstrapScript = document.querySelector(
      'script[src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"]'
    );
    expect(bootstrapScript).not.toBeNull();
  });
});
