import { browser } from 'k6/browser';
import { expect } from 'https://jslib.k6.io/k6-testing/0.5.0/index.js';

export const options = {
  scenarios: {
    ui: {
      executor: 'constant-vus',
      vus: 1,
      duration: '10s',
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
  const page = browser.newPage();

  try {
    await page.goto('https://quickpizza.grafana.com/admin');

    const username = 'admin'; // username = await secrets.get('quickpizza-username');
    const password = 'admin'; // password = await secrets.get('quickpizza-password');

    page.locator('#username').type(username);
    page.locator('#password').type(password);

    const submitButton = page.locator('button');

    await Promise.all([page.waitForNavigation(), submitButton.click()]);

    await expect(page.locator('h2')).toContainText('Latest pizza recommendations');
  } catch (e) {
    console.log('Error during execution:', e);
    throw e;
  } finally {
    page.close();
  }
}
