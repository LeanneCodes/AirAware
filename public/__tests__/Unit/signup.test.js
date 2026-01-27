/**
 * @jest-environment jsdom
 */
const fs = require("fs");
const path = require("path");

function loadHtml() {
  const htmlPath = path.join(__dirname, "..", "..", "signup.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  document.open();
  document.write(html);
  document.close();
}

describe("Signup page (public/signup.html)", () => {
  beforeEach(() => loadHtml());

  test("title + css + script exist", () => {
    expect(document.title).toBe("AirAware+ | Create account");

    expect(
      document.querySelector('link[rel="stylesheet"][href="/signup/signup.css"]')
    ).not.toBeNull();

    const script = document.querySelector('script[src="/signup/signup.js"]');
    expect(script).not.toBeNull();
  });

  test("form has email + password + confirmPassword + error element", () => {
    const form = document.querySelector("form");
    expect(form).not.toBeNull();
    expect(form.hasAttribute("novalidate")).toBe(true);

    expect(document.getElementById("email")).not.toBeNull();
    expect(document.getElementById("password")).not.toBeNull();
    expect(document.getElementById("confirmPassword")).not.toBeNull();

    const err = document.getElementById("passwordError");
    expect(err).not.toBeNull();
    expect(err.style.display).toBe("none");
  });

  test("login link points to /login", () => {
    const link = document.querySelector('a[href="/login"]');
    expect(link).not.toBeNull();
    expect(link.textContent.trim()).toBe("Log in");
  });
});
