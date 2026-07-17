import { expect, test } from '@grafana/plugin-e2e';

import { readScenarioManifest } from '../support/scenario';

test.describe('dem-dev write journeys', () => {
  const manifest = readScenarioManifest();

  test('disables and restores the scenario-defined check', async ({ page }, testInfo) => {
    const checkCard = page
      .getByTestId('checks card')
      .filter({ has: page.getByRole('heading', { name: manifest.job, exact: true }) });
    let restoreRequired = false;

    await page.goto(`/a/grafana-synthetic-monitoring-app/checks?view=card&search=${encodeURIComponent(manifest.job)}`);
    await expect(checkCard).toHaveCount(1);

    try {
      await test.step('Disable the seeded check', async () => {
        await checkCard.getByRole('button', { name: 'Disable check' }).click();
        restoreRequired = true;
        await expect(checkCard.getByText('Disabled', { exact: true })).toBeVisible();
        await testInfo.attach('seeded-check-disabled', {
          body: await page.screenshot({ fullPage: true }),
          contentType: 'image/png',
        });
      });

      await test.step('Restore the seeded check', async () => {
        await checkCard.getByRole('button', { name: 'Enable check' }).click();
        await expect(checkCard.getByText('Enabled', { exact: true })).toBeVisible();
        restoreRequired = false;
        await testInfo.attach('seeded-check-restored', {
          body: await page.screenshot({ fullPage: true }),
          contentType: 'image/png',
        });
      });
    } finally {
      if (restoreRequired) {
        await checkCard.getByRole('button', { name: 'Enable check' }).click();
        await expect(checkCard.getByText('Enabled', { exact: true })).toBeVisible();
      }
    }
  });
});
