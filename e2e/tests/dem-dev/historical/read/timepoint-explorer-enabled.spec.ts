import { SM_FEATURE_NAMES } from '../../../../../src/services/featureFlags.constants';
import { SCENES_TEST_ID } from '../../../../../src/test/dataTestIds.constants';
import { openSeededCheckDashboard } from '../../../../support/checks';
import { smFeatureProfile } from '../../../../support/dem-dev/featureFlags';
import { expect, test } from '../../../../support/dem-dev/fixtures';

test.use(smFeatureProfile({ [SM_FEATURE_NAMES.TimepointExplorer]: true }));

test('shows the timepoint execution experience when Timepoint Explorer is enabled', async ({
  page,
  scenarioManifest,
}, testInfo) => {
  await openSeededCheckDashboard(page, scenarioManifest.job);

  await expect(page.getByTestId(SCENES_TEST_ID.timepoint.list)).toBeVisible();
  await expect(page.getByTestId(SCENES_TEST_ID.timepoint.viewer)).toBeVisible();
  await expect(page.getByLabel('Unsuccessful runs only')).toHaveCount(0);
  await testInfo.attach('timepoint-explorer-enabled', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});
