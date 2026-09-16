import { expect, test } from '@playwright/test';

test('shows the provisioned HTTP check after a page reload', async ({ page }) => {
  const job = process.env.DEM_SMOKE_CHECK_JOB;
  const target = process.env.DEM_SMOKE_CHECK_TARGET;

  if (!process.env.GRAFANA_URL || !job || !target) {
    throw new Error(
      'dem-dev must supply GRAFANA_URL, DEM_SMOKE_CHECK_JOB and DEM_SMOKE_CHECK_TARGET to the test command.'
    );
  }

  await page.goto(`/a/grafana-synthetic-monitoring-app/checks?view=card&search=${encodeURIComponent(job)}`);

  const check = page.getByTestId('checks card').filter({ has: page.getByRole('heading', { name: job, exact: true }) });

  await expect(check).toBeVisible();
  await expect(check.getByText(target, { exact: true })).toBeVisible();

  await page.reload();

  await expect(check).toBeVisible();
  await expect(check.getByText(target, { exact: true })).toBeVisible();
});
