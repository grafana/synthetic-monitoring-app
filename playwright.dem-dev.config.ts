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
  // All projects target the same mutable local stack. Keep them serial until the
  // lifecycle gives each project an isolated runtime.
  workers: 1,
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
      name: 'dem-dev-historical-read',
      testMatch: /historical\/read\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        timezoneId: 'UTC',
      },
    },
    {
      name: 'dem-dev-historical-write',
      testMatch: /historical\/write\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'dem-dev-hybrid-read',
      testMatch: /hybrid\/read\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
