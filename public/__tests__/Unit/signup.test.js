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
  beforeEach(() => {
    loadHtml();
  });

  test("has correct title", () => {
    expect(document.title).toBe("AirAware+ | Create account");
  });

  test("loads favicon", () => {
    const icon = document.querySelector('link[rel="shortcut icon"][href="/assets/favicon.ico"]');
    expect(icon).not.toBeNull();
  });

  test("loads signup script with defer", () => {
    const script = document.querySelector('script[src="/signup/signup.js"]');
    expect(script).not.toBeNull();
    expect(script.hasAttribute("defer")).toBe(true);
  });

  test("loads bootstrap CSS and signup CSS", () => {
    const bootstrapCss = document.querySelector(
      'link[rel="stylesheet"][href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"]'
    );
    expect(bootstrapCss).not.toBeNull();

    const signupCss = document.querySelector('link[rel="stylesheet"][href="/signup/signup.css"]');
    expect(signupCss).not.toBeNull();
  });

  test("has main layout containers", () => {
    expect(document.querySelector("main.min-vh-100")).not.toBeNull();
    expect(document.querySelector(".row.min-vh-100.g-0")).not.toBeNull();
  });

  test("create account form section exists with correct aria-label", () => {
    const formSection = document.querySelector('section[aria-label="Create account form"]');
    expect(formSection).not.toBeNull();
  });

  test("shows heading and helper text", () => {
    const heading = document.querySelector("h1");
    expect(heading).not.toBeNull();
    expect(heading.textContent.trim()).toBe("Create an account");

    const helper = document.querySelector("p.text-body-secondary");
    expect(helper).not.toBeNull();
    expect(helper.textContent).toMatch(/Set up your AirAware\+ account/i);
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
    expect(password.getAttribute("autocomplete")).toBe("new-password");
  });

  test("confirm password input exists with correct attributes + label", () => {
    const label = document.querySelector('label[for="confirmPassword"]');
    expect(label).not.toBeNull();
    expect(label.textContent.replace(/\s+/g, " ").trim()).toBe("Confirm password:");

    const confirm = document.getElementById("confirmPassword");
    expect(confirm).not.toBeNull();
    expect(confirm.tagName).toBe("INPUT");
    expect(confirm.getAttribute("type")).toBe("password");
    expect(confirm.getAttribute("name")).toBe("confirmPassword");
    expect(confirm.hasAttribute("required")).toBe(true);
    expect(confirm.getAttribute("autocomplete")).toBe("new-password");
  });

  test("password error element exists and is hidden by default", () => {
    const err = document.getElementById("passwordError");
    expect(err).not.toBeNull();
    expect(err.classList.contains("text-danger")).toBe(true);
    expect(err.style.display).toBe("none");
  });

  test("create account button exists and is submit", () => {
    const btn = document.querySelector('button[type="submit"]');
    expect(btn).not.toBeNull();
    expect(btn.textContent.trim()).toBe("Create account");
    expect(btn.classList.contains("btn")).toBe(true);
    expect(btn.classList.contains("btn-lg")).toBe(true);
    expect(btn.classList.contains("w-100")).toBe(true);
  });

  test("login link exists and points to /login", () => {
    const loginLink = document.querySelector('a[href="/login"]');
    expect(loginLink).not.toBeNull();
    expect(loginLink.textContent.trim()).toBe("Log in");
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
