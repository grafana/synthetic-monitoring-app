import { expect } from '@grafana/plugin-e2e';
import type { Page } from '@playwright/test';

import { CHECKS_TEST_ID } from '../../src/test/dataTestIds.constants';

export async function openSeededCheckDashboard(page: Page, job: string) {
  await page.goto(`/a/grafana-synthetic-monitoring-app/checks?view=card&search=${encodeURIComponent(job)}`);

  const checkCard = page
    .getByTestId(CHECKS_TEST_ID.card)
    .filter({ has: page.getByRole('heading', { name: job, exact: true }) });

  await expect(checkCard).toHaveCount(1);
  await checkCard.getByRole('link', { name: 'View dashboard' }).click();
  await expect(page).toHaveURL(/\/a\/grafana-synthetic-monitoring-app\/checks\/\d+\/?(?:\?.*)?$/);
}
