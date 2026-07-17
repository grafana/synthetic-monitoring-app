import { expect, test } from '@grafana/plugin-e2e';
import type { Page } from '@playwright/test';

import { SM_FEATURE_NAMES } from '../../src/services/featureFlags.constants';
import { smFeatureProfile } from '../fixtures/featureFlags';
import { readScenarioManifest } from '../support/scenario';

const manifest = readScenarioManifest();

test.use(smFeatureProfile({ [SM_FEATURE_NAMES.TimepointExplorer]: true }));

async function openSeededCheckDashboard(page: Page) {
  await page.goto(`/a/grafana-synthetic-monitoring-app/checks?view=card&search=${encodeURIComponent(manifest.job)}`);

  const checkCard = page
    .getByTestId('checks card')
    .filter({ has: page.getByRole('heading', { name: manifest.job, exact: true }) });
  await expect(checkCard).toHaveCount(1);
  await checkCard.getByRole('link', { name: 'View dashboard' }).click();
  await expect(page).toHaveURL(/\/a\/grafana-synthetic-monitoring-app\/checks\/\d+\/?(?:\?.*)?$/);
}

test('shows the timepoint execution experience when Timepoint Explorer is enabled', async ({ page }, testInfo) => {
  await openSeededCheckDashboard(page);

  await expect(page.getByTestId('scenes timepoint list')).toBeVisible();
  await expect(page.getByTestId('scenes timepoint viewer')).toBeVisible();
  await expect(page.getByLabel('Unsuccessful runs only')).toHaveCount(0);
  await testInfo.attach('timepoint-explorer-enabled', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});
