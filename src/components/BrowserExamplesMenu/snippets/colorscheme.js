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
    checks: ["rate==1.0"]
  }
}

export default async function() {
  const preferredColorScheme = 'dark';

  const context = await browser.newContext({
    // valid values are "light", "dark" or "no-preference"
    colorScheme: preferredColorScheme,
  });
  const page = await context.newPage();

  try {
    await page.goto(
      'https://googlechromelabs.github.io/dark-mode-toggle/demo/',
      { waitUntil: 'load' },
    )
    const colorScheme = await page.evaluate(() => {
      return {
        isDarkColorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches
      };
    });
    await check(colorScheme, {
      'isDarkColorScheme': cs => cs.isDarkColorScheme
    });
  } catch (e) {
    console.log('Error during execution:', e);
    throw e;
  } finally {
    await page.close();
  }
}