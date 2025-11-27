import { browser } from 'k6/browser';
import { expect } from 'https://jslib.k6.io/k6-testing/0.5.0/index.js';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
  },
};

export default async function () {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('https://quickpizza.grafana.com/admin');

    // Enter login credentials and login
    const username = 'admin'; // username = await secrets.get('quickpizza-username');
    const password = 'admin'; // password = await secrets.get('quickpizza-password');

    await page.locator('#username').fill(username);
    await page.locator('#password').fill(password);
    await page.locator('button').click();
    
    await expect(page.locator('//h2')).toContainText("Latest pizza recommendations");
  
  } catch (e) {
    console.log('Error during execution:', e);
    throw e;
  } finally {
    await page.close();
  }
}
