import { expect, test } from '@grafana/plugin-e2e';

import { appUrl, attachScreenshot, TEST_IDS } from './helpers';

// Read-only smoke test for the Probes page. Exercises the real backend's
// probe listing (same proxy route mechanism as check listing -- see
// src/datasource/DataSource.ts), but writes nothing, so it needs no cleanup.
test.describe('probes list', () => {
  test('loads the probes page', async ({ page }, testInfo) => {
    await page.goto(appUrl('probes'));

    await expect(page.getByTestId(TEST_IDS.probesListPublic)).toBeVisible();
    await attachScreenshot(page, testInfo, 'probes-list');
  });
});
