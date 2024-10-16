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
    await page.goto('https://googlechromelabs.github.io/dark-mode-toggle/demo/', {
      waitUntil: 'load',
    });
    let el = await page.$('#dark-mode-toggle-3');
    const mode = await el.getAttribute('mode');
    await check(mode, {
      "GetAttribute('mode')": mode === 'light',
    });
  } finally {
    await page.close();
  }
}
