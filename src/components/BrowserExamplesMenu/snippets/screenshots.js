import http from 'k6/http';
import encoding from 'k6/encoding';
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

function buildLogLine(level, message, extra) {
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...extra,
  });
}

async function pushScreenshotToLoki(screenshotBuffer, caption) {
  const screenshotBase64 = encoding.b64encode(screenshotBuffer);
  const screenshotSize = `${Math.ceil(screenshotBase64.length * 0.75)} bytes`;
  const uuid = uuidv4();
  const CHUNK_SIZE = 200 * 1024;
  const chunkTotal = Math.ceil(screenshotBase64.length / CHUNK_SIZE);

  for (let i = 0; i < chunkTotal; i++) {
    const chunk = screenshotBase64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    await pushToLoki(
      [
        {
          stream: { source: 'synthetic-monitoring-agent-screenshot', level: 'info' },
          values: [
            [
              nowNano(),
              buildLogLine('info', 'page screenshot', {
                id: uuid,
                screenshot_base64: chunk,
                caption,
                screenshot_size_bytes: screenshotSize,
                chunk_index: i,
                chunk_total: chunkTotal,
              }),
            ],
          ],
        },
      ],
      i === 0 ? uuid : null
    );
  }
}

async function pushToLoki(streams, uuid) {
  // These secrets must be configured in your k6 secret source:
  // - sm-screenshot-loki-host: your Loki push endpoint (e.g. https://logs-prod-us-central1.grafana.net)
  // - sm-screenshot-loki-user: your Loki instance user ID
  // - sm-screenshot-write-key: an access policy token with write:logs scope
  const lokiHost = await secrets.get('sm-screenshot-loki-host');
  const lokiUser = await secrets.get('sm-screenshot-loki-user');
  const token = await secrets.get('sm-screenshot-write-key');

  const host = lokiHost.startsWith('http') ? lokiHost : `https://${lokiHost}`;
  const credentials = encoding.b64encode(`${lokiUser}:${token}`);

  const res = http.post(`${host}/loki/api/v1/push`, JSON.stringify({ streams }), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    },
  });

  if (res.status !== 204) {
    console.error(`Loki push failed [${res.status}]: ${res.body}`);
  } else if (uuid) {
    console.log(`screenshot:${uuid}`);
  }
}

export default async function () {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('https://quickpizza.grafana.com', { waitUntil: 'networkidle' });
    await pushScreenshotToLoki(await page.screenshot(), `Snapshot of ${page.url()}`);
  } finally {
    await page.close();
  }
}
