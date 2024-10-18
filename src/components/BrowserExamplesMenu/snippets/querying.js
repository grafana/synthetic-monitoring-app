import { check } from 'https://jslib.k6.io/k6-utils/1.5.0/index.js';
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
    await page.goto('https://test.k6.io/');

    const title = 'test.k6.io';

    await check(page.locator('header h1.title'), {
      'Title with CSS selector': async (locator) => (await locator.textContent()) === title,
    });

    await check(page.locator(`//header//h1[@class="title"]`), {
      'Title with XPath selector': async (locator) => (await locator.textContent()) === title,
    });
  } finally {
    await page.close();
  }
}
