import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

test('shows the provisioned HTTP check after a page reload', async ({ page }) => {
  const manifestPath = process.env.DEM_FIXTURES_FILE;
  if (!process.env.GRAFANA_URL || !manifestPath) {
    throw new Error('dem-dev must supply GRAFANA_URL and DEM_FIXTURES_FILE to the test step.');
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const { job, target } = manifest.fixtures?.['sm/http-check'] ?? {};
  if (typeof job !== 'string' || typeof target !== 'string') {
    throw new Error('The dem-dev fixture manifest must contain sm/http-check with its job and target.');
  }

  await page.goto(`/a/grafana-synthetic-monitoring-app/checks?view=card&search=${encodeURIComponent(job)}`);

  const check = page.getByTestId('checks card').filter({ has: page.getByRole('heading', { name: job, exact: true }) });

  await expect(check).toBeVisible();
  await expect(check.getByText(target, { exact: true })).toBeVisible();

  await page.reload();

  await expect(check).toBeVisible();
  await expect(check.getByText(target, { exact: true })).toBeVisible();
});
