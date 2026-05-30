import { Builder, ThenableWebDriver } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";

export const APP_URL = "http://localhost:4200";

export class BrowserSetup {
  static async buildDriver(): Promise<ThenableWebDriver> {
    const options = new chrome.Options();

    // Si estamos en CI (GitHub Actions), usar modo headless
    if (process.env.CI) {
      options.addArguments("--headless");
      options.addArguments("--no-sandbox");
      options.addArguments("--disable-dev-shm-usage");
      options.addArguments("--window-size=1920,1080");
    }

    const driver = new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    // Configurar timeout implícito para esperar elementos (ej: 10 segundos)
    await driver.manage().setTimeouts({ implicit: 10000 });

    // Opcional: Maximizar la ventana para evitar problemas con responsive
    if (!process.env.CI) {
      await driver.manage().window().maximize();
    }

    return driver;
  }
}
