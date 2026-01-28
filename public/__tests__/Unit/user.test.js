/**
 * @jest-environment jsdom
 */
const fs = require("fs");
const path = require("path");

function loadHtml() {
  const htmlPath = path.join(__dirname, "..", "..", "user.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  document.open();
  document.write(html);
  document.close();
}

describe("User profile page (public/user.html)", () => {
  beforeEach(() => loadHtml());

  test("has correct title", () => {
    expect(document.title).toBe("AirAware+ | Your Profile");
  });

test("loads external profile stylesheet", () => {
  const externalCss = document.querySelector(
    'link[rel="stylesheet"][href="/user-profile/style.css"]'
  );
  expect(externalCss).not.toBeNull();
});

  test("navbar exists with brand logo + nav links + welcome text + profile link", () => {
    const nav = document.querySelector("nav.navbar");
    expect(nav).not.toBeNull();

    // ✅ Robust: select by class, then assert href attribute
    const brandLink = nav.querySelector("a.navbar-brand");
    expect(brandLink).not.toBeNull();
    expect(brandLink.getAttribute("href")).toBe("/");

    const logo = brandLink.querySelector('img[alt="AirAware+"]');
    expect(logo).not.toBeNull();
    expect(logo.getAttribute("src")).toBe("/assets/airaware-logo-no-whitespace.png");

    expect(nav.querySelector('a.nav-link[href="/"]')?.textContent.trim()).toBe("Home");
    expect(nav.querySelector('a.nav-link[href="/dashboard"]')?.textContent.trim()).toBe("Dashboard");
    expect(nav.querySelector('a.nav-link[href="/threshold"]')?.textContent.trim()).toBe("Sensitivity");
    expect(nav.querySelector('a.nav-link[href="/location"]')?.textContent.trim()).toBe("Location");

    const welcome = nav.querySelector(".welcome-text");
    expect(welcome).not.toBeNull();
    expect(welcome.textContent).toMatch(/Welcome,/i);

    const profileLink = nav.querySelector('a[aria-label="Profile"][href="/user"]');
    expect(profileLink).not.toBeNull();
    expect(profileLink.querySelector("svg")).not.toBeNull();
  });

  test("hero avatar section exists with svg icon", () => {
    const hero = document.querySelector("section.hero");
    expect(hero).not.toBeNull();
    expect(hero.getAttribute("aria-hidden")).toBe("true");

    const avatarCircle = hero.querySelector(".avatarCircle");
    expect(avatarCircle).not.toBeNull();

    const svg = avatarCircle.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
  });

  test("form contains required inputs/selects with correct labels", () => {
    const form = document.querySelector("form.formGrid");
    expect(form).not.toBeNull();

    expect(document.getElementById("firstName")?.tagName).toBe("INPUT");
    expect(document.getElementById("lastName")?.tagName).toBe("INPUT");
    expect(document.getElementById("dob")?.getAttribute("type")).toBe("date");
    expect(document.getElementById("sexAtBirth")?.tagName).toBe("SELECT");
    expect(document.getElementById("gender")?.tagName).toBe("SELECT");
    expect(document.getElementById("nationality")?.tagName).toBe("INPUT");
  });

  test("save button exists and is submit", () => {
    const btn = document.querySelector('button.btnPrimary[type="submit"]');
    expect(btn).not.toBeNull();
    expect(btn.textContent.trim()).toBe("Save profile");
  });

  test("loads profile JS file", () => {
    expect(document.querySelector('script[src="/user-profile/user.js"]')).not.toBeNull();
  });
});
