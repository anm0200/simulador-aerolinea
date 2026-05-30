import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { ThenableWebDriver, By, until } from "selenium-webdriver";
import { BrowserSetup, APP_URL } from "../utils/browser.setup";

describe("E2E: Authentication Flow", () => {
  let driver: ThenableWebDriver;

  beforeAll(async () => {
    driver = await BrowserSetup.buildDriver();
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it("debe iniciar sesión exitosamente con usuario E2E Responsable", async () => {
    await driver.get(`${APP_URL}/login`);

    const emailInput = await driver.wait(
      until.elementLocated(By.id("email")),
      10000,
    );
    const passwordInput = await driver.findElement(By.id("password"));
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));

    await emailInput.sendKeys("e2e_admin@test.com");
    await passwordInput.sendKeys("E2E_Admin123!");
    await submitBtn.click();

    // Tras el login exitoso, debería redirigir a /map (o la raíz /)
    await driver.wait(
      until.urlMatches(new RegExp(`${APP_URL}/?$|${APP_URL}/map`)),
      15000,
    );

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).not.toContain("/login");
  });
});
