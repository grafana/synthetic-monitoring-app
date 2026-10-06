import { expect, test } from '@grafana/plugin-e2e';

import { appUrl, deleteCheckByName, fillMinimalHttpCheck, TEST_IDS } from './helpers';

// Full create journey against a real backend: fill the Checkster form for an
// HTTP check, save it, and confirm it lands on the check's dashboard and
// shows up in the list. Cleans up via the UI afterwards so repeated runs
// don't pile up checks on the target stack.
test.describe('create an HTTP check', () => {
  let jobName: string;

  test.beforeEach(() => {
    jobName = `e2e-http-check-${Date.now()}`;
  });

  test.afterEach(async ({ page }) => {
    await deleteCheckByName(page, jobName);
  });

  test('creates, saves, and lists a basic HTTP check', async ({ page }) => {
    // Lands directly on the Checkster form with the check type preselected,
    // the same URL the legacy /checks/new/http redirect resolves to.
    await page.goto(appUrl('checks/new/api-endpoint?checkType=http'));

    await fillMinimalHttpCheck(page, jobName);
    await page.getByTestId(TEST_IDS.checksterForm.submitButton).click();

    await expect(page).toHaveURL(/\/checks\/\d+(?:$|[/?])/);

    await page.goto(appUrl('checks'));
    await page.getByTestId(TEST_IDS.checkFiltersSearch).fill(jobName);
    await expect(page.getByText(jobName, { exact: true })).toBeVisible();
  });
});
