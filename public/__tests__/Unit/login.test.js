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
  beforeEach(() => {
    loadHtml();
  });

  test("has correct title", () => {
    expect(document.title).toBe("AirAware+ | Login");
  });

  test("loads favicon", () => {
    const icon = document.querySelector('link[rel="shortcut icon"][href="/assets/favicon.ico"]');
    expect(icon).not.toBeNull();
  });

  test("loads login script with defer", () => {
    const script = document.querySelector('script[src="/login/login.js"]');
    expect(script).not.toBeNull();
    expect(script.hasAttribute("defer")).toBe(true);
  });

  test("loads bootstrap CSS and login CSS", () => {
    const bootstrapCss = document.querySelector(
      'link[rel="stylesheet"][href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"]'
    );
    expect(bootstrapCss).not.toBeNull();

    const loginCss = document.querySelector('link[rel="stylesheet"][href="/login/login.css"]');
    expect(loginCss).not.toBeNull();
  });

  test("has main layout containers", () => {
    expect(document.querySelector("main.min-vh-100")).not.toBeNull();
    expect(document.querySelector(".row.min-vh-100.g-0")).not.toBeNull();
  });

  test("login form section exists with correct aria-label", () => {
    const formSection = document.querySelector('section[aria-label="Login form"]');
    expect(formSection).not.toBeNull();
  });

  test("shows heading and helper text", () => {
    const heading = document.querySelector('h1');
    expect(heading).not.toBeNull();
    expect(heading.textContent.trim()).toBe("Login");

    const helper = document.querySelector("p.text-body-secondary");
    expect(helper).not.toBeNull();
    expect(helper.textContent).toMatch(/Enter your account details/i);
  });

  test("form exists and has novalidate (JS-controlled submit)", () => {
    const form = document.querySelector("form");
    expect(form).not.toBeNull();
    expect(form.hasAttribute("novalidate")).toBe(true);
  });

  test("email input exists with correct attributes + label", () => {
    const label = document.querySelector('label[for="email"]');
    expect(label).not.toBeNull();
    expect(label.textContent.trim()).toBe("Email:");

    const email = document.getElementById("email");
    expect(email).not.toBeNull();
    expect(email.tagName).toBe("INPUT");
    expect(email.getAttribute("type")).toBe("email");
    expect(email.getAttribute("name")).toBe("email");
    expect(email.hasAttribute("required")).toBe(true);
    expect(email.getAttribute("autocomplete")).toBe("email");
  });

  test("password input exists with correct attributes + label", () => {
    const label = document.querySelector('label[for="password"]');
    expect(label).not.toBeNull();
    expect(label.textContent.trim()).toBe("Password:");

    const password = document.getElementById("password");
    expect(password).not.toBeNull();
    expect(password.tagName).toBe("INPUT");
    expect(password.getAttribute("type")).toBe("password");
    expect(password.getAttribute("name")).toBe("password");
    expect(password.hasAttribute("required")).toBe(true);
    expect(password.getAttribute("autocomplete")).toBe("current-password");
  });

  test("login button exists and is submit", () => {
    const btn = document.querySelector('button[type="submit"]');
    expect(btn).not.toBeNull();
    expect(btn.textContent.trim()).toBe("Login");
    expect(btn.classList.contains("btn")).toBe(true);
    expect(btn.classList.contains("btn-lg")).toBe(true);
    expect(btn.classList.contains("w-100")).toBe(true);
  });

  test("signup link exists and points to /signup", () => {
    const signupLink = document.querySelector('a[href="/signup"]');
    expect(signupLink).not.toBeNull();
    expect(signupLink.textContent.trim()).toBe("Sign up");
  });

  test("mobile logo exists in the small-screen container", () => {
    const mobileLogo = document.querySelector('.d-md-none img[alt="AirAware+"]');
    expect(mobileLogo).not.toBeNull();
    expect(mobileLogo.getAttribute("src")).toBe("/assets/airaware-logo-no-whitespace.png");
  });

  test("right pane exists and contains the large logo (desktop only section)", () => {
    const pane = document.querySelector("section.bg-pane.d-none.d-md-flex");
    expect(pane).not.toBeNull();

    const paneLogo = pane.querySelector('img[alt="AirAware+"]');
    expect(paneLogo).not.toBeNull();
    expect(paneLogo.getAttribute("src")).toBe('/assets/AirAwareLogo(white).png');
  });
});
