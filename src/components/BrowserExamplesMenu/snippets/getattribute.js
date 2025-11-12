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
    await page.goto('https://googlechromelabs.github.io/dark-mode-toggle/demo/');

    await expect(page.locator('#dark-mode-toggle-3')).toHaveAttribute('mode', 'light');
  } catch (e) {
    console.log('Error during execution:', e);
    throw e;
  } finally {
    await page.close();
  }
}
