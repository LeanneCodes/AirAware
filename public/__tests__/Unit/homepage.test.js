/**
 * @jest-environment jsdom
 */
const fs = require("fs");
const path = require("path");

describe("Homepage (public/index.html)", () => {
  beforeAll(() => {
    const htmlPath = path.join(__dirname, "..", "..", "index.html");
    const html = fs.readFileSync(htmlPath, "utf8");
    document.documentElement.innerHTML = html;
  });

  test("has correct title", () => {
    const titleEl = document.querySelector("title");
    expect(titleEl).not.toBeNull();
    expect(titleEl.textContent).toBe("AirAware+ | Homepage");
  });

  test("loads homepage stylesheet", () => {
    const css = document.querySelector('link[rel="stylesheet"][href="/homepage/style.css"]');
    expect(css).not.toBeNull();
  });

  test("navbar shows brand logo + welcome chip + profile link", () => {
    const nav = document.querySelector("nav.nav");
    expect(nav).not.toBeNull();

    const logo = nav.querySelector('img.brandlogo[alt="AirAware+"]');
    expect(logo).not.toBeNull();
    expect(logo.getAttribute("src")).toBe("/assets/logo-clear-bg.png");

    const welcome = nav.querySelector(".navright a.chip");
    expect(welcome).not.toBeNull();
    expect(welcome.textContent).toMatch(/Welcome/i);

    const profile = nav.querySelector('a.profile[href="/user.html"][aria-label="Profile"]');
    expect(profile).not.toBeNull();
    expect(profile.querySelector("svg")).not.toBeNull();
  });

  test("hero section contains headline and subtitle", () => {
    const hero = document.querySelector("section.hero");
    expect(hero).not.toBeNull();

    const title = hero.querySelector("h1.heroTitle");
    expect(title).not.toBeNull();
    expect(title.textContent).toMatch(/How does today’s air affect/i);

    const subtitle = hero.querySelector("p.heroSubtitle");
    expect(subtitle).not.toBeNull();
    expect(subtitle.textContent).toMatch(/helps you understand air quality/i);
  });

  test("has 3 navigation tiles with correct labels and hrefs", () => {
    const tiles = [...document.querySelectorAll("section.tiles a.tile")];
    expect(tiles).toHaveLength(3);

    const expected = [
      { href: "/dashboard.html", label: "Air Quality Dashboard" },
      { href: "/threshold.html", label: "My Sensitivity Level" },
      { href: "/location.html", label: "Location Settings" },
    ];

    expected.forEach(({ href, label }) => {
      const tile = document.querySelector(`a.tile[href="${href}"]`);
      expect(tile).not.toBeNull();
      expect(tile.textContent).toMatch(label);
    });
  });

  test("loads bootstrap bundle script with defer + homepage JS", () => {
    const bootstrap = document.querySelector(
      'script[src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"]'
    );
    expect(bootstrap).not.toBeNull();
    expect(bootstrap.hasAttribute("defer")).toBe(true);

    const homeJs = document.querySelector('script[src="/homepage/homepage.js"]');
    expect(homeJs).not.toBeNull();
  });
});
