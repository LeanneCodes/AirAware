/**
 * @jest-environment jsdom
 */
const fs = require("fs");
const path = require("path");

describe("User profile page (public/user.html)", () => {
  beforeAll(() => {
    const htmlPath = path.join(__dirname, "..", "..", "user.html");
    const html = fs.readFileSync(htmlPath, "utf8");
    document.documentElement.innerHTML = html;
  });

  test("has correct title", () => {
    const titleEl = document.querySelector("title");
    expect(titleEl).not.toBeNull();
    expect(titleEl.textContent).toBe("AirAware+ | Profile");
  });

  test("loads profile stylesheet", () => {
    const css = document.querySelector('link[rel="stylesheet"][href="/user-profile/style.css"]');
    expect(css).not.toBeNull();
  });

  test("navbar exists with brand logo + Homepage link", () => {
    const nav = document.getElementById("nav");
    expect(nav).not.toBeNull();

    const brandLink = nav.querySelector('a.navleft[href="/index.html"][aria-label="AirAware Homepage"]');
    expect(brandLink).not.toBeNull();

    const logo = brandLink.querySelector('img.brandlogo[alt="AirAware+"]');
    expect(logo).not.toBeNull();
    
    expect(logo.getAttribute("src")).toBe("../assets/logo-clear-bg.png");

    const homepageChip = nav.querySelector('a.chip[href="/index.html"]');
    expect(homepageChip).not.toBeNull();
    expect(homepageChip.textContent.trim()).toBe("Homepage");
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

  test("form contains all required inputs with correct labels", () => {
    const form = document.querySelector("form.formGrid");
    expect(form).not.toBeNull();

    const fields = [
      { id: "firstName", label: "First name" },
      { id: "lastName", label: "Last name" },
      { id: "dob", label: "Date of Birth" },
      { id: "sexAtBirth", label: "Sex at Birth" },
      { id: "gender", label: "Gender (How do you identify?)" },
      { id: "nationality", label: "Nationality" },
    ];

    fields.forEach(({ id, label }) => {
      const input = document.getElementById(id);
      expect(input).not.toBeNull();
      expect(input.tagName).toBe("INPUT");

      const labelEl = document.querySelector(`label[for="${id}"]`);
      expect(labelEl).not.toBeNull();
      expect(labelEl.textContent.trim()).toBe(label);
    });

    
    expect(document.getElementById("dob").getAttribute("placeholder")).toBe("dd / mm / yyyy");
  });

  test("save button exists and is submit", () => {
    const btn = document.querySelector('button.btnPrimary[type="submit"]');
    expect(btn).not.toBeNull();
    expect(btn.textContent.trim()).toBe("Save profile");
  });

  test("loads profile JS file", () => {
    const script = document.querySelector('script[src="/user-profile/user.js"]');
    expect(script).not.toBeNull();
  });
});
