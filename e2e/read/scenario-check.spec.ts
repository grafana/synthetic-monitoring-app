import { expect, test } from '@grafana/plugin-e2e';

import { readScenarioManifest } from '../support/scenario';

test.describe('dem-dev read journeys', () => {
  const manifest = readScenarioManifest();

  test('lists the scenario-defined check and opens its dashboard', async ({ page }, testInfo) => {
    const checkCard = page
      .getByTestId('checks card')
      .filter({ has: page.getByRole('heading', { name: manifest.job, exact: true }) });

    await test.step('Find the seeded check', async () => {
      await page.goto(
        `/a/grafana-synthetic-monitoring-app/checks?view=card&search=${encodeURIComponent(manifest.job)}`
      );

      await expect(checkCard).toHaveCount(1);
      await expect(checkCard).toContainText(manifest.target);
      await expect(checkCard).toContainText(`${manifest.frequency_ms / 1000}s frequency`);

      const probeCount = Object.keys(manifest.probes).length;
      await expect(checkCard).toContainText(`${probeCount} ${probeCount === 1 ? 'location' : 'locations'}`);
      await testInfo.attach('seeded-check-list', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    });

    await test.step('Open the check dashboard', async () => {
      await checkCard.getByRole('link', { name: 'View dashboard' }).click();

      await expect(page).toHaveURL(/\/a\/grafana-synthetic-monitoring-app\/checks\/\d+\/?(?:\?.*)?$/);
      await expect(page.getByText('Uptime', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Reachability', { exact: true }).first()).toBeVisible();
      await testInfo.attach('seeded-check-dashboard', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    });
  });
});
