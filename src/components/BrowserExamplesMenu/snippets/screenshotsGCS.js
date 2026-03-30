// Screenshots (External storage — GCS)
//
// Captures a screenshot, uploads the image to a Google Cloud Storage bucket,
// and logs a URL reference. The image bytes never pass through Loki — only a small
// reference log line is stored. Best for large-scale checks where Loki ingestion
// volume is a concern.
//
// IMPORTANT: The bucket must allow public read access for the stored objects.
// The screenshots are rendered via <img> tags in the browser, which cannot attach
// storage credentials. The object URLs contain UUIDs and are not guessable.
//
// Required secrets (Synthetic Monitoring > Config > Secrets):
//   - sm-screenshot-loki-host: your Loki push endpoint
//   - sm-screenshot-loki-auth: base64-encoded user:token string (used directly to avoid credential leaking via httpDebug)
//   - sm-screenshot-gcs-token: a GCS OAuth2 access token or service account token
//   - sm-screenshot-gcs-bucket: your GCS bucket name (e.g. my-screenshots-bucket)
//
// The frontend detects screenshots via two required log lines:
//   1. console.log(`screenshot:${uuid}`) — written to execution logs for discovery
//   2. A JSON log line with source="synthetic-monitoring-agent-screenshot" — the payload
// Both are required for the screenshot to appear in the UI.

import http from 'k6/http';
import secrets from 'k6/secrets';
import { browser } from 'k6/browser';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

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

function nowNano() {
  return String(Date.now() * 1_000_000);
}

async function captureAndUploadScreenshot(page, caption) {
  const screenshotBuffer = await page.screenshot();
  const uuid = uuidv4();
  const filename = `${uuid}.png`;

  const gcsToken = await secrets.get('sm-screenshot-gcs-token');
  const gcsBucket = await secrets.get('sm-screenshot-gcs-bucket');

  // Upload to GCS using the JSON API
  const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${gcsBucket}/o?uploadType=media&name=${filename}`;
  const uploadRes = http.post(uploadUrl, screenshotBuffer, {
    headers: {
      'Content-Type': 'image/png',
      Authorization: `Bearer ${gcsToken}`,
    },
  });

  if (uploadRes.status !== 200) {
    console.error(`GCS upload failed [${uploadRes.status}]: ${uploadRes.body}`);
    return;
  }

  // Public download URL
  const screenshotUrl = `https://storage.googleapis.com/${gcsBucket}/${filename}`;

  // Push a small reference log line to Loki (no image data, just the URL)
  const lokiHost = await secrets.get('sm-screenshot-loki-host');
  const lokiAuth = await secrets.get('sm-screenshot-loki-auth');

  const host = lokiHost.startsWith('http') ? lokiHost : `https://${lokiHost}`;

  const payload = JSON.stringify({
    streams: [
      {
        stream: { source: 'synthetic-monitoring-agent-screenshot', level: 'info' },
        values: [
          [
            nowNano(),
            JSON.stringify({
              id: uuid,
              screenshot_url: screenshotUrl,
              caption,
            }),
          ],
        ],
      },
    ],
  });

  const lokiRes = http.post(`${host}/loki/api/v1/push`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${lokiAuth}`,
    },
  });

  if (lokiRes.status !== 204) {
    console.error(`Loki push failed [${lokiRes.status}]: ${lokiRes.body}`);
  } else {
    // This log line is required — the frontend uses it to discover screenshots
    console.log(`screenshot:${uuid}`);
  }
}

export default async function () {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('https://quickpizza.grafana.com', { waitUntil: 'networkidle' });
    await captureAndUploadScreenshot(page, `Snapshot of ${page.url()}`);
  } finally {
    await page.close();
  }
}
