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
  beforeEach(() => loadHtml());

  test("has correct title", () => {
    expect(document.title).toBe("AirAware+ | Home");
  });

  test("loads homepage stylesheet", () => {
    expect(document.querySelector('link[rel="stylesheet"][href="/homepage/style.css"]')).not.toBeNull();
  });

  test("navbar shows brand logo + welcome text + profile link", () => {
    const nav = document.querySelector("nav.navbar");
    expect(nav).not.toBeNull();

    const brandLink = nav.querySelector("a.navbar-brand");
    expect(brandLink).not.toBeNull();
    expect(brandLink.getAttribute("href")).toBe("/");

    const logo = brandLink.querySelector('img[alt="AirAware+"]');
    expect(logo).not.toBeNull();
    expect(logo.getAttribute("src")).toBe("/assets/airaware-logo-no-whitespace.png");

    const welcome = nav.querySelector(".welcome-text");
    expect(welcome).not.toBeNull();
    expect(welcome.textContent).toMatch(/Welcome,/i);

    const profileLink = nav.querySelector('a[aria-label="Profile"][href="/user"]');
    expect(profileLink).not.toBeNull();
    expect(profileLink.querySelector("svg")).not.toBeNull();
  });

  test("navbar has expected nav links", () => {
    const nav = document.querySelector("nav.navbar");
    expect(nav).not.toBeNull();

    expect(nav.querySelector('a.nav-link.active[href="/"]')?.textContent.trim()).toBe("Home");
    expect(nav.querySelector('a.nav-link[href="/dashboard"]')?.textContent.trim()).toBe("Dashboard");
    expect(nav.querySelector('a.nav-link[href="/threshold"]')?.textContent.trim()).toBe("Sensitivity");
    expect(nav.querySelector('a.nav-link[href="/location"]')?.textContent.trim()).toBe("Location");
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

  test("hero CTAs exist", () => {
    expect(document.querySelector('a.btn.btn-aa.btn-lg[href="/dashboard"]')).not.toBeNull();
    expect(document.querySelector('a.btn.btn-outline-aa.btn-lg[href="/threshold"]')).not.toBeNull();
  });

  test("scripts exist: bootstrap, leaflet, homepage.js", () => {
    expect(
      document.querySelector(
        'script[src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"]'
      )
    ).not.toBeNull();

    const leaflet = document.querySelector('script[src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"]');
    expect(leaflet).not.toBeNull();
    expect(leaflet.hasAttribute("defer")).toBe(true);

    expect(document.querySelector('script[src="/homepage/homepage.js"]')).not.toBeNull();
  });
});
