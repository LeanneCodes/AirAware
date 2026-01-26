/**
 * @jest-environment jsdom
 */
const fs = require("fs");
const path = require("path");

function loadHtml() {
  const htmlPath = path.join(__dirname, "..", "..", "location.html");
  const html = fs.readFileSync(htmlPath, "utf8");

  document.open();
  document.write(html);
  document.close();
}

describe("Location page (public/location.html)", () => {
  beforeEach(() => {
    loadHtml();
  });

  test("has correct title", () => {
    expect(document.title).toBe("AirAware+ | Location Settings");
  });

  test("loads location stylesheet", () => {
    const css = document.querySelector('link[rel="stylesheet"][href="/location/style.css"]');
    expect(css).not.toBeNull();
  });

  test("loads location script with defer", () => {
    const script = document.querySelector('script[src="/location/location.js"]');
    expect(script).not.toBeNull();
    expect(script.hasAttribute("defer")).toBe(true);
  });

  test("navbar exists with brand logo + nav links + profile link", () => {
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

    // Location should be active
    const locationLink = nav.querySelector('a.nav-link.active[href="/location"]');
    expect(locationLink).not.toBeNull();
    expect(locationLink.getAttribute("aria-current")).toBe("page");
    expect(locationLink.textContent.trim()).toBe("Location");

    // Welcome text
    const welcome = nav.querySelector(".welcome-text");
    expect(welcome).not.toBeNull();
    expect(welcome.textContent).toMatch(/Welcome,/i);

    // Profile link
    const profileLink = nav.querySelector('a[aria-label="Profile"][href="/user"]');
    expect(profileLink).not.toBeNull();
    expect(profileLink.querySelector("svg")).not.toBeNull();
  });

  test("hero section exists with heading and description", () => {
    const hero = document.querySelector("header.page-hero");
    expect(hero).not.toBeNull();

    const heading = hero.querySelector("h1");
    expect(heading).not.toBeNull();
    expect(heading.textContent).toMatch(/Location Settings/i);

    const desc = hero.querySelector("p");
    expect(desc).not.toBeNull();
    expect(desc.textContent).toMatch(/Enter a city or postcode/i);
  });

  test("location form exists with city + postcode inputs and buttons", () => {
    const form = document.getElementById("locationForm");
    expect(form).not.toBeNull();
    expect(form.tagName).toBe("FORM");
    expect(form.getAttribute("autocomplete")).toBe("on");

    // City input
    const cityLabel = document.querySelector('label[for="cityInput"]');
    expect(cityLabel).not.toBeNull();
    expect(cityLabel.textContent.trim()).toBe("City");

    const cityInput = document.getElementById("cityInput");
    expect(cityInput).not.toBeNull();
    expect(cityInput.tagName).toBe("INPUT");
    expect(cityInput.getAttribute("name")).toBe("city");
    expect(cityInput.getAttribute("type")).toBe("text");
    expect(cityInput.getAttribute("placeholder")).toMatch(/London/i);

    // Divider OR
    const divider = document.querySelector(".divider");
    expect(divider).not.toBeNull();
    expect(divider.textContent.trim()).toBe("OR");

    // Postcode input
    const postcodeLabel = document.querySelector('label[for="postcodeInput"]');
    expect(postcodeLabel).not.toBeNull();
    expect(postcodeLabel.textContent.trim()).toBe("Postcode");

    const postcodeInput = document.getElementById("postcodeInput");
    expect(postcodeInput).not.toBeNull();
    expect(postcodeInput.tagName).toBe("INPUT");
    expect(postcodeInput.getAttribute("name")).toBe("postcode");
    expect(postcodeInput.getAttribute("type")).toBe("text");
    expect(postcodeInput.getAttribute("placeholder")).toMatch(/SW1P/i);

    // Buttons
    const saveBtn = form.querySelector('button.btnPrimary[type="submit"]');
    expect(saveBtn).not.toBeNull();
    expect(saveBtn.textContent.trim()).toBe("Save location");

    const clearBtn = document.getElementById("clearBtn");
    expect(clearBtn).not.toBeNull();
    expect(clearBtn.tagName).toBe("BUTTON");
    expect(clearBtn.getAttribute("type")).toBe("button");
    expect(clearBtn.textContent).toMatch(/Clear/i);
  });

  test("success message element exists and is hidden by default", () => {
    const success = document.getElementById("saveSuccess");
    expect(success).not.toBeNull();

    expect(success.getAttribute("aria-live")).toBe("polite");
    expect(success.style.display).toBe("none");
    expect(success.textContent).toMatch(/Location saved successfully/i);
  });

  test("footer exists with privacy/terms/accessibility links", () => {
    expect(document.querySelector('a.footer-link[href="/privacy"]')).not.toBeNull();
    expect(document.querySelector('a.footer-link[href="/terms"]')).not.toBeNull();
    expect(document.querySelector('a.footer-link[href="/accessibility"]')).not.toBeNull();

    expect(document.querySelector("footer")?.textContent).toMatch(/©\s*2026\s*AirAware\+/i);
  });

  test("loads bootstrap bundle script", () => {
    const bootstrap = document.querySelector(
      'script[src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"]'
    );
    expect(bootstrap).not.toBeNull();
  });
});
