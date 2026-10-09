import { expect, test } from '@grafana/plugin-e2e';

import { appUrl, attachScreenshot, deleteCheckByName, fillMinimalCheck, TEST_IDS } from './helpers';

// Same create journey as create-http-check.spec.ts, for a different check
// type -- Ping's form is the simplest in the API Endpoint group (job + target
// only, no method/body/auth), so this is a cheap way to cover a second
// Checkster layout against the real backend rather than only ever exercising
// HTTP's.
test.describe('create a ping check', () => {
  let jobName: string;

  test.beforeEach(() => {
    jobName = `e2e-ping-check-${Date.now()}`;
  });

  test.afterEach(async ({ page }) => {
    await deleteCheckByName(page, jobName);
  });

  test('creates, saves, and lists a basic ping check', async ({ page }, testInfo) => {
    await page.goto(appUrl('checks/new/api-endpoint?checkType=ping'));
    await expect(page.getByRole('radio', { name: 'Ping' })).toBeChecked();

    await fillMinimalCheck(page, jobName, 'grafana.com');
    await attachScreenshot(page, testInfo, 'form-filled');

    await page.getByTestId(TEST_IDS.checksterForm.submitButton).click();
    await expect(page).toHaveURL(/\/checks\/\d+(?:$|[/?])/);
    await attachScreenshot(page, testInfo, 'check-dashboard');

    await page.goto(appUrl('checks'));
    await page.getByTestId(TEST_IDS.checkFiltersSearch).fill(jobName);
    await expect(page.getByText(jobName, { exact: true })).toBeVisible();
    await attachScreenshot(page, testInfo, 'check-in-list');
  });
});
