import { CHECKS_TEST_ID } from '../../../../../src/test/dataTestIds.constants';
import { expect, test } from '../../../../support/dem-dev/fixtures';

test.describe('dem-dev historical read journeys', () => {
  test('lists the scenario-defined check and opens its dashboard', async ({ page, scenarioManifest }, testInfo) => {
    const checkCard = page
      .getByTestId(CHECKS_TEST_ID.card)
      .filter({ has: page.getByRole('heading', { name: scenarioManifest.job, exact: true }) });

    await test.step('Find the seeded check', async () => {
      await page.goto(
        `/a/grafana-synthetic-monitoring-app/checks?view=card&search=${encodeURIComponent(scenarioManifest.job)}`
      );

      await expect(checkCard).toHaveCount(1);
      await expect(checkCard).toContainText(scenarioManifest.target);
      await expect(checkCard).toContainText(`${scenarioManifest.frequency_ms / 1000}s frequency`);

      const probeCount = Object.keys(scenarioManifest.probes).length;
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
