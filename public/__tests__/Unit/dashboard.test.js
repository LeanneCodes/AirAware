/**
 * @jest-environment jsdom
 */
const fs = require("fs");
const path = require("path");

function loadHtml() {
  const htmlPath = path.join(__dirname, "..", "..", "dashboard.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  document.open();
  document.write(html);
  document.close();
}

describe("Dashboard page (public/dashboard.html)", () => {
  beforeEach(() => loadHtml());

  test("has correct title", () => {
    expect(document.title).toBe("AirAware+ | Dashboard");
  });

  test("loads dashboard stylesheet", () => {
    expect(document.querySelector('link[rel="stylesheet"][href="/dashboard/style.css"]')).not.toBeNull();
  });

  test("navbar has brand link + logo + profile link", () => {
    const nav = document.querySelector("nav.navbar");
    expect(nav).not.toBeNull();

    const brandLink = nav.querySelector("a.navbar-brand");
    expect(brandLink).not.toBeNull();
    expect(brandLink.getAttribute("href")).toBe("/");

    const logo = brandLink.querySelector('img[alt="AirAware+"]');
    expect(logo).not.toBeNull();
    expect(logo.getAttribute("src")).toBe("/assets/airaware-logo-no-whitespace.png");

    const profile = nav.querySelector('a[aria-label="Profile"][href="/user"]');
    expect(profile).not.toBeNull();
  });

  test("pollutant cards exist (pm25, pm10, so2, no2, o3, co)", () => {
    const pollutants = ["pm25", "pm10", "so2", "no2", "o3", "co"];
    pollutants.forEach((p) => {
      expect(document.querySelector(`.pollCard[data-pollutant="${p}"]`)).not.toBeNull();
      expect(document.getElementById(`${p}Value`)).not.toBeNull();
      expect(document.getElementById(`${p}Status`)).not.toBeNull();
    });
  });

  test("loads dashboard script with defer", () => {
    const script = document.querySelector('script[src="/dashboard/dashboard.js"]');
    expect(script).not.toBeNull();
    expect(script.hasAttribute("defer")).toBe(true);
  });
});
