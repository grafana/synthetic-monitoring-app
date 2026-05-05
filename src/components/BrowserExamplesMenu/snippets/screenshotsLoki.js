// Screenshots (Loki storage)
//
// Captures a screenshot and stores the base64 image data directly in Loki.
// Simple setup — only requires Loki credentials. Best for getting started.
//
// Required secrets (Synthetic Monitoring > Config > Secrets):
//   - sm-screenshot-loki-host: your Loki base URL (e.g. https://logs-dev-005.grafana-dev.net)
//   - sm-screenshot-loki-auth: base64-encoded user:token string

import { browser } from 'k6/browser';
import { captureScreenshot, loki } from 'https://jslib.k6.io/sm-screenshots/0.1.0/index.js';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      options: { browser: { type: 'chromium' } },
    },
  },
};

export default async function () {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('https://quickpizza.grafana.com', { waitUntil: 'networkidle' });
    await captureScreenshot(page, { caption: `Snapshot of ${page.url()}`, store: loki() });
  } finally {
    await page.close();
  }
}
