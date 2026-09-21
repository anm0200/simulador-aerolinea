const puppeteer = require('puppeteer'); 
(async () => { 
  const browser = await puppeteer.launch(); 
  const page = await browser.newPage(); 
  page.on('console', msg => console.log('LOG:', msg.text())); 
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText)); 
  page.on('response', response => console.log('RESPONSE:', response.url(), response.status())); 
  await page.goto('http://localhost/login'); 
  await page.type('#email', 'e2e_admin@test.com'); 
  await page.type('#password', 'E2E_Admin123!'); 
  await page.click('button[type="submit"]'); 
  await page.waitForNavigation({waitUntil: 'networkidle0', timeout: 5000}).catch(e => console.log('NAV TIMEOUT')); 
  console.log('Final URL:', page.url());
  await browser.close(); 
  console.log('Done'); 
})();
