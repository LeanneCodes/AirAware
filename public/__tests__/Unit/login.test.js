/**
 * @jest-environment jsdom
 */
const fs = require("fs");
const path = require("path");

function loadHtml() {
  const htmlPath = path.join(__dirname, "..", "..", "login.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  document.open();
  document.write(html);
  document.close();
}

describe("Login page (public/login.html)", () => {
  beforeEach(() => loadHtml());

  test("title + css + script exist", () => {
    expect(document.title).toBe("AirAware+ | Login");

    expect(
      document.querySelector('link[rel="stylesheet"][href="/login/login.css"]')
    ).not.toBeNull();

    // ✅ Only assert script exists, not how it loads
    const script = document.querySelector('script[src="/login/login.js"]');
    expect(script).not.toBeNull();
  });

  test("form has email + password + submit", () => {
    const form = document.querySelector("form");
    expect(form).not.toBeNull();
    expect(form.hasAttribute("novalidate")).toBe(true);

    expect(document.getElementById("email")).not.toBeNull();
    expect(document.getElementById("password")).not.toBeNull();

    const submit = document.querySelector('button[type="submit"]');
    expect(submit).not.toBeNull();
    expect(submit.textContent.trim()).toBe("Login");
  });

  test("signup link points to /signup", () => {
    const link = document.querySelector('a[href="/signup"]');
    expect(link).not.toBeNull();
    expect(link.textContent.trim()).toBe("Sign up");
  });
});
