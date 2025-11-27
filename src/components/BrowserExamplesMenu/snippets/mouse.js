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
  const page = await browser.newPage();

  try {
    await page.goto('https://quickpizza.grafana.com/');

    // Wait for the login link to be available
    const loginLink = page.locator('a[href="/login"]');
    await loginLink.waitFor();

    // Obtain ElementHandle for login link and navigate to it
    // by clicking in the 'a' element's bounding box
    const loginLinkElement = await page.$('a[href="/login"]');
    const loginLinkBox = await loginLinkElement.boundingBox();

    await Promise.all([
      page.waitForNavigation(),
      page.mouse.click(loginLinkBox.x + loginLinkBox.width / 2, loginLinkBox.y),
    ]);

    await expect(page.locator('h1')).toContainText('QuickPizza User Login');
  } catch (e) {
    console.log('Error during execution:', e);
    throw e;
  } finally {
    await page.close();
  }
}
