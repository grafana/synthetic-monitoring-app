import { expect, test } from '@grafana/plugin-e2e';

import { SM_FEATURE_NAMES } from '../../../../src/services/featureFlags.constants';
import { SCENES_TEST_ID } from '../../../../src/test/dataTestIds.constants';
import { openSeededCheckDashboard } from '../../../support/checks';
import { smFeatureProfile } from '../../../support/dem-dev/featureFlags';
import { readScenarioManifest } from '../../../support/dem-dev/scenarioManifest';

const manifest = readScenarioManifest();

test.use(smFeatureProfile({ [SM_FEATURE_NAMES.TimepointExplorer]: false }));

test('shows legacy execution logs when Timepoint Explorer is disabled', async ({ page }, testInfo) => {
  await openSeededCheckDashboard(page, manifest.job);

  await expect(page.getByLabel('Unsuccessful runs only')).toBeVisible();
  await expect(page.getByTestId(SCENES_TEST_ID.timepoint.list)).toHaveCount(0);
  await testInfo.attach('timepoint-explorer-disabled', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});
