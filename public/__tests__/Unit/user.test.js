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
  beforeEach(() => {
    loadHtml();
  });

  test("has correct title", () => {
    expect(document.title).toBe("AirAware+ | Your Profile");
  });

  test("uses inline styles (external profile stylesheet is not linked)", () => {
    // External stylesheet link is commented out in user.html, so we should NOT expect it
    const externalCss = document.querySelector(
      'link[rel="stylesheet"][href="/user-profile/style.css"]'
    );
    expect(externalCss).toBeNull();

    // There is inline styling for this page for the moment
    const styleTag = document.querySelector("head style");
    expect(styleTag).not.toBeNull();
    expect(styleTag.textContent).toMatch(/--aa-primary/i);
  });

  test("navbar exists with brand logo + nav links + welcome text + profile link", () => {
    const nav = document.querySelector("nav.navbar");
    expect(nav).not.toBeNull();

    // Brand link + logo
    const brandLink = nav.querySelector('a.navbar-brand[aria-label="AirAware+ Home"][href="/"]');
    expect(brandLink).not.toBeNull();

    const logo = brandLink.querySelector('img[alt="AirAware+"]');
    expect(logo).not.toBeNull();
    expect(logo.getAttribute("src")).toBe("/assets/airaware-logo-no-whitespace.png");

    // Nav links
    expect(nav.querySelector('a.nav-link[href="/"]')?.textContent.trim()).toBe("Home");
    expect(nav.querySelector('a.nav-link[href="/dashboard"]')?.textContent.trim()).toBe("Dashboard");
    expect(nav.querySelector('a.nav-link[href="/threshold"]')?.textContent.trim()).toBe("Sensitivity");
    expect(nav.querySelector('a.nav-link[href="/location"]')?.textContent.trim()).toBe("Location");

    // Welcome text
    const welcome = nav.querySelector(".welcome-text");
    expect(welcome).not.toBeNull();
    expect(welcome.textContent).toMatch(/Welcome,/i);

    // Profile link
    const profile = nav.querySelector('a[aria-label="Profile"][href="/user"]');
    expect(profile).not.toBeNull();
    expect(profile.querySelector("svg")).not.toBeNull();
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

    // Headline + subtitle
    const title = hero.querySelector("h1.hero-title");
    expect(title).not.toBeNull();
    expect(title.textContent).toMatch(/Your Profile/i);

    const subtitle = hero.querySelector("p.hero-subtitle");
    expect(subtitle).not.toBeNull();
    expect(subtitle.textContent).toMatch(/Keep your details up to date/i);
  });

  test("form contains required inputs/selects with correct labels", () => {
    const form = document.querySelector("form.formGrid");
    expect(form).not.toBeNull();

    // First name
    const firstName = document.getElementById("firstName");
    expect(firstName).not.toBeNull();
    expect(firstName.tagName).toBe("INPUT");
    expect(firstName.getAttribute("type")).toBe("text");
    expect(firstName.hasAttribute("required")).toBe(true);
    expect(document.querySelector('label[for="firstName"]')?.textContent.trim()).toBe("First name");

    // Last name
    const lastName = document.getElementById("lastName");
    expect(lastName).not.toBeNull();
    expect(lastName.tagName).toBe("INPUT");
    expect(lastName.getAttribute("type")).toBe("text");
    expect(lastName.hasAttribute("required")).toBe(true);
    expect(document.querySelector('label[for="lastName"]')?.textContent.trim()).toBe("Last name");

    // DOB (date input)
    const dob = document.getElementById("dob");
    expect(dob).not.toBeNull();
    expect(dob.tagName).toBe("INPUT");
    expect(dob.getAttribute("type")).toBe("date");
    expect(dob.hasAttribute("required")).toBe(true);
    expect(document.querySelector('label[for="dob"]')?.textContent.trim()).toBe("Date of birth");

    // Sex at birth (select)
    const sexAtBirth = document.getElementById("sexAtBirth");
    expect(sexAtBirth).not.toBeNull();
    expect(sexAtBirth.tagName).toBe("SELECT");
    expect(document.querySelector('label[for="sexAtBirth"]')?.textContent.trim())
      .toBe("Sex at birth (optional)");

    // Gender (select)
    const gender = document.getElementById("gender");
    expect(gender).not.toBeNull();
    expect(gender.tagName).toBe("SELECT");
    expect(document.querySelector('label[for="gender"]')?.textContent.trim())
      .toBe("Gender (optional)");

    // Nationality (text input)
    const nationality = document.getElementById("nationality");
    expect(nationality).not.toBeNull();
    expect(nationality.tagName).toBe("INPUT");
    expect(nationality.getAttribute("type")).toBe("text");
    expect(nationality.getAttribute("placeholder")).toBe("e.g., British");
    expect(document.querySelector('label[for="nationality"]')?.textContent.trim())
      .toBe("Nationality (optional)");
  });

  test("save button exists and is submit", () => {
    const btn = document.querySelector('button.btnPrimary[type="submit"]');
    expect(btn).not.toBeNull();
    expect(btn.textContent.trim()).toBe("Save profile");
  });

  test("footer exists with privacy/terms/accessibility links", () => {
    expect(document.querySelector('a.footer-link[href="/privacy"]')).not.toBeNull();
    expect(document.querySelector('a.footer-link[href="/terms"]')).not.toBeNull();
    expect(document.querySelector('a.footer-link[href="/accessibility"]')).not.toBeNull();

    expect(document.querySelector("footer")?.textContent).toMatch(/©\s*2026\s*AirAware\+/i);
  });

  test("loads profile JS file", () => {
    const script = document.querySelector('script[src="/user-profile/user.js"]');
    expect(script).not.toBeNull();
  });

  test("loads bootstrap bundle script", () => {
    const bootstrap = document.querySelector(
      'script[src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"]'
    );
    expect(bootstrap).not.toBeNull();
  });
});
