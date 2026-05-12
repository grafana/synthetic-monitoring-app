// Screenshots (External storage — GCS)
//
// Captures a screenshot, uploads to a GCS bucket, and logs a URL reference to Loki.
// Best for production/scale — avoids Loki ingestion volume from large images.
//
// Required secrets (Synthetic Monitoring > Config > Secrets):
//   - sm-screenshot-loki-host: your Loki base URL (e.g. https://logs-dev-005.grafana-dev.net)
//   - sm-screenshot-loki-auth: base64-encoded user:token string
//   - sm-screenshot-gcs-access-key: GCS HMAC access key
//   - sm-screenshot-gcs-secret-key: GCS HMAC secret key
//   - sm-screenshot-gcs-bucket: GCS bucket name
//
// IMPORTANT: The bucket must allow public read access for stored objects.
// Screenshots are rendered via <img> tags that cannot attach auth headers.
// Object URLs contain UUIDs and are not guessable.

import { browser } from 'k6/browser';
import { captureScreenshot, gcs } from 'https://jslib.k6.io/sm-screenshots/0.1.0/index.js';

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
    await captureScreenshot(page, { caption: `Snapshot of ${page.url()}`, store: gcs() });
  } finally {
    await page.close();
  }
}
