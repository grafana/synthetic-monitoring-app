import { expect } from 'https://jslib.k6.io/k6-testing/0.5.0/index.js';
import { browser } from 'k6/browser';

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
    await page.goto('https://quickpizza.grafana.com/');

    const title = 'Looking to break out of your pizza routine?';

    await expect(page.locator('h1')).toContainText(title);

    await expect(page.locator(`//h1`)).toContainText(title);
  } catch (e) {
    console.log('Error during execution:', e);
    throw e;
  } finally {
    await page.close();
  }
}
