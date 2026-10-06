import { existsSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { defineConfig, devices } from '@playwright/test';
import type { PluginOptions } from '@grafana/plugin-e2e';
import { instrumentPlaywright } from '@grafana-cloud/test-observability';
import type { ReplayReporterOptions } from '@grafana-cloud/test-observability/reporter';
import { parse as parseDotenv } from 'dotenv';

const NEEDED_ENV_KEYS = [
  'SM_E2E_RESULTS_API_URL',
  'SM_E2E_RESULTS_STACK_ID',
  'SM_E2E_RESULTS_API_TOKEN',
  'SM_E2E_FARO_COLLECTOR_URL',
] as const;

if (existsSync('.env')) {
  const parsed = parseDotenv(readFileSync('.env'));
  for (const key of NEEDED_ENV_KEYS) {
    if (parsed[key] !== undefined && process.env[key] === undefined) {
      process.env[key] = parsed[key];
    }
  }
}
const resultsApiUrl = process.env.SM_E2E_RESULTS_API_URL;
const resultsStackId = process.env.SM_E2E_RESULTS_STACK_ID?.trim();
const resultsApiToken = process.env.SM_E2E_RESULTS_API_TOKEN ?? '';

if (resultsApiUrl && !resultsApiToken.trim()) {
  throw new Error(
    'SM_E2E_RESULTS_API_TOKEN is required when SM_E2E_RESULTS_API_URL is set. Use a Cloud Access Policy token for the configured stack with e2e-test-results:write.'
  );
}

if (resultsApiUrl && !resultsStackId) {
  throw new Error('SM_E2E_RESULTS_STACK_ID is required when SM_E2E_RESULTS_API_URL is set.');
}

const replayReporterOptions: ReplayReporterOptions = {
  outputFile: 'e2e-results/replays.json',
  recording: {
    bundleDirectory: 'e2e-results/bundles',
    upload: resultsApiUrl
      ? {
          baseUrl: resultsApiUrl,
          stackId: resultsStackId,
          token: resultsApiToken,
        }
      : undefined,
  },
};

// Browser-side RUM (console, errors, user actions) via Faro, correlated to the
// backend traces the host stack already captures for the SM datasource backend.
// Only wired up when a collector URL is supplied — local runs skip it by default.
if (process.env.SM_E2E_FARO_COLLECTOR_URL) {
  instrumentPlaywright({
    url: process.env.SM_E2E_FARO_COLLECTOR_URL,
    appName: 'synthetic-monitoring-app',
    appVersion: process.env.GITHUB_SHA,
    environment: process.env.PLAYWRIGHT_ENVIRONMENT ?? 'local',
    namespace: 'synthetic-monitoring-app',
  });
}

const pluginE2eAuth = `${dirname(require.resolve('@grafana/plugin-e2e'))}/auth`;

export default defineConfig<PluginOptions>({
  globalSetup: require.resolve('@grafana-cloud/test-observability/run-setup'),
  testDir: './tests/playwright',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  expect: {
    timeout: 30_000,
  },
  outputDir: 'e2e-results/playwright',
  reporter: [
    ['list'],
    ['@grafana-cloud/test-observability/reporter', replayReporterOptions],
    [
      'html',
      {
        open: 'never',
        outputFolder: 'e2e-results/playwright-report',
      },
    ],
  ],
  use: {
    baseURL: process.env.GRAFANA_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'auth',
      testDir: pluginE2eAuth,
      testMatch: [/.*\.js/],
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['auth'],
    },
  ],
});
