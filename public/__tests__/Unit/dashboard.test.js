/**
 * @jest-environment jsdom
 */
const fs = require("fs");
const path = require("path");

describe("Dashboard page (public/dashboard.html)", () => {
  beforeAll(() => {
    const htmlPath = path.join(__dirname, "..", "..", "dashboard.html");
    const html = fs.readFileSync(htmlPath, "utf8");
    document.documentElement.innerHTML = html; 
  });

  test("has correct title", () => {
    const titleEl = document.querySelector("title");
    expect(titleEl).not.toBeNull();
    expect(titleEl.textContent).toBe("AirAware+ | Dashboard page");
  });

  test("loads dashboard stylesheet", () => {
    const link = document.querySelector('link[rel="stylesheet"][href="/dashboard/style.css"]');
    expect(link).not.toBeNull();
  });

  test("navbar has Homepage + Profile + welcome chip", () => {
    expect(document.querySelector('a.chip[href="/index.html"]')?.textContent.trim()).toBe("Homepage");
    expect(document.getElementById("welcomeChip")?.textContent).toMatch(/Welcome/i);
    expect(document.querySelector('a.profile[href="/user.html"][aria-label="Profile"]')).not.toBeNull();
  });

  test("brand logo exists", () => {
    const logo = document.querySelector('img.brandlogo[alt="AirAware+"]');
    expect(logo).not.toBeNull();
    expect(logo.getAttribute("src")).toBe("/assets/logo-clear-bg.png");
  });

  test("location bar buttons exist", () => {
    expect(document.getElementById("locationText")?.textContent).toMatch(/Current Location/i);
    expect(document.getElementById("alertsBtn")?.tagName).toBe("BUTTON");
    expect(document.getElementById("refreshBtn")?.tagName).toBe("BUTTON");
  });

  test("renders 5 metric cards + expected IDs", () => {
    const cards = [...document.querySelectorAll(".metricCard")];
    expect(cards).toHaveLength(5);

    const metrics = ["pm25", "o3", "co", "so2", "no2"];
    metrics.forEach((m) => {
      expect(document.querySelector(`.metricCard[data-metric="${m}"]`)).not.toBeNull();
      expect(document.getElementById(`${m}Value`)).not.toBeNull();
      expect(document.getElementById(`${m}Status`)).not.toBeNull();
    });
  });

  test("bottom panels exist", () => {
    expect(document.getElementById("adviceText")).not.toBeNull();
    expect(document.getElementById("safeLevels")).not.toBeNull();
    expect(document.getElementById("recentAlerts")).not.toBeNull();
  });

  test("loads dashboard script with defer", () => {
    const script = document.querySelector('script[src="/dashboard/dashboard.js"]');
    expect(script).not.toBeNull();
    expect(script.hasAttribute("defer")).toBe(true);
  });
});
