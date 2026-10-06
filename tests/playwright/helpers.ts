import { expect, type Page } from '@playwright/test';

// Mirrors of the data-testid constants in src/test/dataTestIds.ts. Duplicated
// (not imported) because these tests run outside the src/ TS program — keep in
// sync by hand if those ids change.
export const TEST_IDS = {
  createCheckButton: 'action create check',
  chooseTypeGroupCard: (group: string) => `checks group-card-${group}`,
  checkFiltersSearch: 'checks filters search',
  checkListItemEditButton: 'checks list-item edit-button',
  checksterForm: {
    navigationExecution: 'checkEditor navigation execution',
    submitButton: 'checkEditor form submit',
    jobInput: 'checkEditor form job',
    probeCheckbox: 'checkEditor form probeCheckbox',
  },
} as const;

export const PLUGIN_ID = 'grafana-synthetic-monitoring-app';

export function appUrl(path: string) {
  return `/a/${PLUGIN_ID}/${path}`;
}

/** Fills in the minimum fields needed to save a new HTTP check and picks the first available probe. */
export async function fillMinimalHttpCheck(page: Page, jobName: string) {
  await page.getByTestId(TEST_IDS.checksterForm.jobInput).fill(jobName);
  await page.getByLabel('Request target').fill('https://grafana.com/');

  await page.getByTestId(TEST_IDS.checksterForm.navigationExecution).click();
  await page.getByTestId(TEST_IDS.checksterForm.probeCheckbox).first().check();
}

/**
 * Deletes a check from the Checks list by job name, via the UI delete-confirm
 * flow. Relies on the search filter narrowing the list to exactly this check,
 * so the "Delete check" icon button (its accessible name, per
 * CheckItemActionButtons.tsx) resolves unambiguously.
 */
export async function deleteCheckByName(page: Page, jobName: string) {
  await page.goto(appUrl('checks'));
  await page.getByTestId(TEST_IDS.checkFiltersSearch).fill(jobName);
  await expect(page.getByText(jobName, { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Delete check' }).click();

  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Delete check' }).click();

  await expect(page.getByText(jobName, { exact: true })).toHaveCount(0);
}
