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
  beforeEach(() => loadHtml());

  test("has correct title", () => {
    expect(document.title).toBe("AirAware+ | Location Settings");
  });

  test("loads location stylesheet", () => {
    expect(document.querySelector('link[rel="stylesheet"][href="/location/style.css"]')).not.toBeNull();
  });

  test("loads location script with defer", () => {
    const script = document.querySelector('script[src="/location/location.js"]');
    expect(script).not.toBeNull();
    expect(script.hasAttribute("defer")).toBe(true);
  });

  test("navbar exists with brand logo + nav links + profile link", () => {
    const nav = document.querySelector("nav.navbar");
    expect(nav).not.toBeNull();

    const brandLink = nav.querySelector("a.navbar-brand");
    expect(brandLink).not.toBeNull();
    expect(brandLink.getAttribute("href")).toBe("/");

    const logo = brandLink.querySelector('img[alt="AirAware+"]');
    expect(logo).not.toBeNull();
    expect(logo.getAttribute("src")).toBe("/assets/airaware-logo-no-whitespace.png");

    expect(nav.querySelector('a.nav-link[href="/"]')?.textContent.trim()).toBe("Home");
    expect(nav.querySelector('a.nav-link[href="/dashboard"]')?.textContent.trim()).toBe("Dashboard");
    expect(nav.querySelector('a.nav-link[href="/threshold"]')?.textContent.trim()).toBe("Sensitivity");

    const locationLink = nav.querySelector('a.nav-link.active[href="/location"]');
    expect(locationLink).not.toBeNull();
    expect(locationLink.getAttribute("aria-current")).toBe("page");
    expect(locationLink.textContent.trim()).toBe("Location");

    const profileLink = nav.querySelector('a[aria-label="Profile"][href="/user"]');
    expect(profileLink).not.toBeNull();
  });

  test("hero section exists", () => {
    const hero = document.querySelector("header.page-hero");
    expect(hero).not.toBeNull();

    expect(hero.querySelector("h1")?.textContent).toMatch(/Location Settings/i);
    expect(hero.querySelector("p")?.textContent).toMatch(/Enter a city or postcode/i);
  });

  test("form exists with inputs + buttons", () => {
    const form = document.getElementById("locationForm");
    expect(form).not.toBeNull();

    const city = document.getElementById("cityInput");
    const postcode = document.getElementById("postcodeInput");

    expect(city).not.toBeNull();
    expect(postcode).not.toBeNull();

    expect(document.querySelector('label[for="cityInput"]')?.textContent.trim()).toBe("City");
    expect(document.querySelector('label[for="postcodeInput"]')?.textContent.trim()).toBe("Postcode");

    const saveBtn = form.querySelector('button.btnPrimary[type="submit"]');
    expect(saveBtn).not.toBeNull();

    const clearBtn = document.getElementById("clearBtn");
    expect(clearBtn).not.toBeNull();
    expect(clearBtn.getAttribute("type")).toBe("button");
  });

  test("toast container exists and inline message is hidden by default", () => {

  const toastContainer = document.getElementById("aaToastContainer");
  expect(toastContainer).not.toBeNull();

  const notFound = document.getElementById("notFoundMessage");
  expect(notFound).not.toBeNull();
  expect(notFound.style.display).toBe("none");
});


  test("loads bootstrap bundle script", () => {
    expect(
      document.querySelector(
        'script[src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"]'
      )
    ).not.toBeNull();
  });
});
