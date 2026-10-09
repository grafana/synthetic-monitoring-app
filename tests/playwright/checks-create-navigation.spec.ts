import { expect, test } from '@grafana/plugin-e2e';

import { appUrl, attachScreenshot, TEST_IDS } from './helpers';

// Smoke-tests the "create a new check" entry point redesigned in #1900:
// Checks list -> choose a check type group -> land on the Checkster form
// with the right check type preselected. Doesn't submit anything, so it
// needs no backend state and no cleanup.
test.describe('create a new check navigation', () => {
  test('navigates from the checks list to the HTTP check form', async ({ page }, testInfo) => {
    await page.goto(appUrl('checks'));
    await attachScreenshot(page, testInfo, 'checks-list');

    await page.getByTestId(TEST_IDS.createCheckButton).click();
    await expect(page).toHaveURL(/\/checks\/choose-type/);
    await attachScreenshot(page, testInfo, 'choose-check-type');

    await page
      .getByTestId(TEST_IDS.chooseTypeGroupCard('api-endpoint'))
      .getByRole('button', { name: 'API Endpoint' })
      .click();
    await expect(page).toHaveURL(/\/checks\/new\/api-endpoint/);

    await expect(page.getByRole('radio', { name: 'HTTP' })).toBeChecked();
    await expect(page.getByTestId(TEST_IDS.checksterForm.jobInput)).toBeVisible();
    await attachScreenshot(page, testInfo, 'http-check-form');
  });
});
