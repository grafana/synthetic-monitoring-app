import { browser } from 'k6/browser';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      options: { browser: { type: 'chromium' } },
    },
  },
};

export default async function () {
  const page = await browser.newPage();
  try {
    await page.goto('https://test.k6.io/');
    // When screenshots are enabled in SM, upload settings are supplied automatically.
    await page.screenshot({ path: 'capture.png' });

    await page.goto('https://test.k6.io/contacts.php');
    // Each capture gets its own UUID, even when the filename is reused.
    await page.screenshot({ path: 'capture.png' });
  } finally {
    await page.close();
  }
}
