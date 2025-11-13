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
};

export default async function () {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('https://quickpizza.grafana.com/admin');

    const userInput = page.locator('#username');
    await userInput.fill('');
    await userInput.click();
    await page.keyboard.type('admin');

    const pwdInput = page.locator('#password');
    await pwdInput.fill('');
    await pwdInput.click();
    await page.keyboard.type('admin');

    await page.locator('button').click();

    await expect(page.locator('//h2')).toContainText('Latest pizza recommendations');
  } catch (e) {
    console.log('Error during execution:', e);
    throw e;
  } finally {
    await page.close();
  }
}
