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
    await page.goto('https://quickpizza.grafana.com/admin');

   
    const userInput = page.locator('#username');
    await userInput.click();
    await page.keyboard.type('admin');

    const pwdInput = page.locator('#password');
    await pwdInput.click();
    await page.keyboard.type('admin');

    await page.locator('button').click();

    const heading = page.locator('//h2');
    await heading.waitFor({ state: "visible", timeout: 5000 });
    await expect(heading).toContainText("Latest pizza recommendations");
    
  } catch (e) {
    console.log('Error during execution:', e);
    throw e;
  } finally {
    await page.close();
  }
}
