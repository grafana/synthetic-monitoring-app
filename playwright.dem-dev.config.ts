import { defineConfig, devices } from '@playwright/test';
import type { PluginOptions } from '@grafana/plugin-e2e';

const baseURL = process.env.GRAFANA_URL ?? 'http://localhost:3000';
const captureEveryJourney = Boolean(process.env.CI) || process.env.PLAYWRIGHT_CAPTURE === 'always';

export default defineConfig<PluginOptions>({
  testDir: './e2e/tests/dem-dev',
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR ?? './e2e-results',
  timeout: 60_000,
  expect: {
    timeout: 30_000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['line'], ['github'], ['blob']]
    : [['list'], ['html', { open: 'never', outputFolder: 'artifacts/playwright-report' }]],
  use: {
    baseURL,
    screenshot: captureEveryJourney ? 'on' : 'only-on-failure',
    trace: 'retain-on-failure',
    video: captureEveryJourney ? 'on' : 'retain-on-failure',
  },
  projects: [
    {
      name: 'dem-dev-read',
      testMatch: /read\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'dem-dev-write',
      dependencies: ['dem-dev-read'],
      testMatch: /write\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
