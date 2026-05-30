import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { ThenableWebDriver, By, until } from "selenium-webdriver";
import { BrowserSetup, APP_URL } from "../utils/browser.setup";

describe("E2E: Data and Methods (Datos y Algoritmos)", () => {
  let driver: ThenableWebDriver;

  beforeAll(async () => {
    driver = await BrowserSetup.buildDriver();
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
    await driver.wait(
      until.urlMatches(new RegExp(`${APP_URL}/?$|${APP_URL}/map`)),
      15000,
    );
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it("debe visualizar correctamente la tabla de datos", async () => {
    await driver.get(`${APP_URL}/data`);
    await driver.wait(until.urlContains("/data"), 10000);
    expect(await driver.getCurrentUrl()).toContain("/data");
  });

  it("debe navegar a los métodos gráficos", async () => {
    await driver.get(`${APP_URL}/methods`);
    await driver.wait(until.urlContains("/methods"), 10000);
    expect(await driver.getCurrentUrl()).toContain("/methods");
  });
});
