/**
 * @jest-environment jsdom
 */
const fs = require("fs");
const path = require("path");

function loadHtml() {
  const htmlPath = path.join(__dirname, "..", "..", "index.html");
  const html = fs.readFileSync(htmlPath, "utf8");

  document.open();
  document.write(html);
  document.close();
}

describe("Homepage (public/index.html)", () => {
  beforeEach(() => {
    loadHtml();
  });

  test("has correct title", () => {
    expect(document.title).toBe("AirAware+ | Home");
  });

  test("loads homepage stylesheet", () => {
    const css = document.querySelector('link[rel="stylesheet"][href="/homepage/style.css"]');
    expect(css).not.toBeNull();
  });

  test("loads Leaflet stylesheet", () => {
    const leafletCss = document.querySelector(
      'link[rel="stylesheet"][href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"]'
    );
    expect(leafletCss).not.toBeNull();
  });

  test("navbar shows brand logo + welcome text + profile link", () => {
    const nav = document.querySelector("nav.navbar");
    expect(nav).not.toBeNull();

    // Brand link + logo
    const brandLink = nav.querySelector('a.navbar-brand[aria-label="AirAware+ Home"][href="/"]');
    expect(brandLink).not.toBeNull();

    const logo = nav.querySelector('a.navbar-brand img[alt="AirAware+"]');
    expect(logo).not.toBeNull();
    expect(logo.getAttribute("src")).toBe("/assets/airaware-logo-no-whitespace.png");

    // Welcome text + username span
    const welcomeText = nav.querySelector(".welcome-text");
    expect(welcomeText).not.toBeNull();
    expect(welcomeText.textContent).toMatch(/Welcome,/i);

    const welcomeUserName = nav.querySelector("#welcomeUserName");
    expect(welcomeUserName).not.toBeNull();

    // Profile button (link)
    const profileLink = nav.querySelector('a[aria-label="Profile"][href="/user"]');
    expect(profileLink).not.toBeNull();
    expect(profileLink.querySelector("svg")).not.toBeNull();
  });

  test("navbar has expected nav links", () => {
    // Home (active)
    expect(document.querySelector('a.nav-link.active[href="/"]')?.textContent.trim()).toBe("Home");
    expect(document.querySelector('a.nav-link[href="/dashboard"]')?.textContent.trim()).toBe("Dashboard");
    expect(document.querySelector('a.nav-link[href="/threshold"]')?.textContent.trim()).toBe("Sensitivity");
    expect(document.querySelector('a.nav-link[href="/location"]')?.textContent.trim()).toBe("Location");
  });

  test("disclaimer exists and is non-medical", () => {
    const disclaimer = document.querySelector(".bg-white.border-bottom p");
    expect(disclaimer).not.toBeNull();
    expect(disclaimer.textContent).toMatch(/not a medical tool/i);
  });

  test("hero section contains headline and description", () => {
    const hero = document.querySelector("section.hero-surface");
    expect(hero).not.toBeNull();

    const headline = hero.querySelector("h1");
    expect(headline).not.toBeNull();
    expect(headline.textContent).toMatch(/How does today’s air affect/i);

    const description = hero.querySelector("p.text-body-secondary");
    expect(description).not.toBeNull();
    expect(description.textContent).toMatch(/AirAware\+ helps you understand air quality/i);
  });

  test("hero call-to-action buttons exist with correct hrefs", () => {
    const dashboardCta = document.querySelector('a.btn.btn-aa.btn-lg[href="/dashboard"]');
    expect(dashboardCta).not.toBeNull();
    expect(dashboardCta.textContent).toMatch(/View dashboard/i);

    const sensitivityCta = document.querySelector('a.btn.btn-outline-aa.btn-lg[href="/threshold"]');
    expect(sensitivityCta).not.toBeNull();
    expect(sensitivityCta.textContent).toMatch(/Check sensitivity/i);
  });

  test("snapshot card exists with key IDs", () => {
    expect(document.getElementById("snapshotAQLabel")).not.toBeNull();
    expect(document.getElementById("snapshotAQNote")).not.toBeNull();

    // Badges
    ["badgePm25", "badgePm10", "badgeNo2", "badgeO3", "badgeSo2", "badgeCo", "badgeUpdated"].forEach((id) => {
      expect(document.getElementById(id)).not.toBeNull();
    });

    // Refresh button
    const refreshBtn = document.getElementById("homeRefreshBtn");
    expect(refreshBtn).not.toBeNull();
    expect(refreshBtn.tagName).toBe("BUTTON");
    expect(refreshBtn.getAttribute("aria-label")).toBe("Refresh today’s snapshot");

    // Primary pollutant + sensitivity
    expect(document.getElementById("primaryPollutant")).not.toBeNull();
    expect(document.getElementById("primaryPollutantNote")).not.toBeNull();
    expect(document.getElementById("userSensitivity")).not.toBeNull();

    // Location section
    expect(document.getElementById("locationLabel")).not.toBeNull();
    expect(document.getElementById("locationNote")).not.toBeNull();
    expect(document.getElementById("locationActionLink")).not.toBeNull();
    expect(document.getElementById("viewOnMap")).not.toBeNull();

    // Mini map container exists, even if it is hidden
    const miniMap = document.getElementById("miniMap");
    expect(miniMap).not.toBeNull();
    expect(miniMap.getAttribute("aria-label")).toBe("Map showing current location");
  });

  test("pollutant explainer accordion exists with 6 items", () => {
    const accordion = document.getElementById("pollutantsAccordion");
    expect(accordion).not.toBeNull();

    const items = [...accordion.querySelectorAll(".accordion-item")];
    expect(items).toHaveLength(6);

    // Spot-check one known header/button
    const pm25Btn = document.querySelector('#headingPm25 button[data-bs-target="#collapsePm25"]');
    expect(pm25Btn).not.toBeNull();
    expect(pm25Btn.textContent).toMatch(/PM₂\.₅/i);
  });

  test("footer exists with privacy/terms/accessibility links", () => {
    expect(document.querySelector('a.footer-link[href="/privacy"]')).not.toBeNull();
    expect(document.querySelector('a.footer-link[href="/terms"]')).not.toBeNull();
    expect(document.querySelector('a.footer-link[href="/accessibility"]')).not.toBeNull();

    expect(document.querySelector("footer")?.textContent).toMatch(/©\s*2026\s*AirAware\+/i);
  });

  test("loads scripts: bootstrap bundle, leaflet, homepage.js", () => {
    // Bootstrap: present
    const bootstrap = document.querySelector(
      'script[src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"]'
    );
    expect(bootstrap).not.toBeNull();

    // Leaflet: has defer
    const leaflet = document.querySelector('script[src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"]');
    expect(leaflet).not.toBeNull();
    expect(leaflet.hasAttribute("defer")).toBe(true);

    // Homepage logic
    const homeJs = document.querySelector('script[src="/homepage/homepage.js"]');
    expect(homeJs).not.toBeNull();
  });
});
