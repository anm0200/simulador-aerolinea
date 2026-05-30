import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { ThenableWebDriver, By, until } from "selenium-webdriver";
import { BrowserSetup, APP_URL } from "../utils/browser.setup";

describe("E2E: Navigation Flow", () => {
  let driver: ThenableWebDriver;

  beforeAll(async () => {
    driver = await BrowserSetup.buildDriver();
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it("should navigate to different pages from home", async () => {
    await driver.get(`${APP_URL}/`);

    // Esperar a que la página cargue, por ejemplo verificando un título o elemento del navbar
    await driver.wait(until.elementLocated(By.css("app-header")), 5000);

    const url = await driver.getCurrentUrl();
    expect(url).toBe(`${APP_URL}/`);

    // Si queremos probar navegación específica, deberíamos buscar los enlaces del menú
    // const mapLink = await driver.findElement(By.css('a[href="/map"]'));
    // await mapLink.click();
    // await driver.wait(until.urlContains('/map'), 5000);
  });
});
