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

    // calling evaluate without arguments
    let result = await page.evaluate(() => {
      return Promise.resolve(5 * 42);
    });
    expect(result).toBe(210);

    // calling evaluate with arguments
    result = await page.evaluate(
      ([x, y]) => {
        return Promise.resolve(x * y);
      },
      [5, 5]
    );
    expect(result).toBe(25);
  } catch (e) {
    console.log('Error during execution:', e);
    throw e;
  } finally {
    await page.close();
  }
}
