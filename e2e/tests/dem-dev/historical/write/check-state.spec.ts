import { CHECKS_TEST_ID } from '../../../../../src/test/dataTestIds.constants';
import { expect, test } from '../../../../support/dem-dev/fixtures';

test.describe('dem-dev historical write journeys', () => {
  test('persists check enablement changes across page reloads', async ({ page, scenarioManifest }, testInfo) => {
    const checkCard = page
      .getByTestId(CHECKS_TEST_ID.card)
      .filter({ has: page.getByRole('heading', { name: scenarioManifest.job, exact: true }) });

    await page.goto(
      `/a/grafana-synthetic-monitoring-app/checks?view=card&search=${encodeURIComponent(scenarioManifest.job)}`
    );
    await expect(checkCard).toHaveCount(1);

    try {
      await test.step('Disable the seeded check', async () => {
        await checkCard.getByRole('button', { name: 'Disable check' }).click();
        await expect(checkCard.getByText('Disabled', { exact: true })).toBeVisible();

        await page.reload();
        await expect(checkCard).toHaveCount(1);
        await expect(checkCard.getByText('Disabled', { exact: true })).toBeVisible();
        await testInfo.attach('seeded-check-disabled', {
          body: await page.screenshot({ fullPage: true }),
          contentType: 'image/png',
        });
      });

      await test.step('Restore the seeded check', async () => {
        await checkCard.getByRole('button', { name: 'Enable check' }).click();
        await expect(checkCard.getByText('Enabled', { exact: true })).toBeVisible();

        await page.reload();
        await expect(checkCard).toHaveCount(1);
        await expect(checkCard.getByText('Enabled', { exact: true })).toBeVisible();
        await testInfo.attach('seeded-check-restored', {
          body: await page.screenshot({ fullPage: true }),
          contentType: 'image/png',
        });
      });
    } finally {
      await page.reload();
      await expect(checkCard).toHaveCount(1);

      const enableButton = checkCard.getByRole('button', { name: 'Enable check' });
      if (await enableButton.isVisible()) {
        await enableButton.click();
        await expect(checkCard.getByText('Enabled', { exact: true })).toBeVisible();
      }
    }
  });
});
