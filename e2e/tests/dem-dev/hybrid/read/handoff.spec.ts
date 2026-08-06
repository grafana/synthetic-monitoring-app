import { SM_FEATURE_NAMES } from '../../../../../src/services/featureFlags.constants';
import { SCENES_TEST_ID } from '../../../../../src/test/dataTestIds.constants';
import type { Locator } from '@playwright/test';
import { expect, test } from '../../../../support/dem-dev/fixtures';
import { smFeatureProfile } from '../../../../support/dem-dev/featureFlags';

test.use(smFeatureProfile({ [SM_FEATURE_NAMES.TimepointExplorer]: true }));

test('renders historical evidence, a live Simnet 503, and recovery under one check identity', async ({
  page,
  hybridRunManifest,
}, testInfo) => {
  const { binding, history, phases, plan } = hybridRunManifest;
  const failure = phases.find((phase) => phase.name === 'live-fault-verified')?.observation;
  const recovery = phases.find((phase) => phase.name === 'live-recovery-verified')?.observation;
  expect(failure, 'controller must verify live fault evidence before the browser journey').toBeDefined();
  expect(recovery, 'controller must verify live recovery evidence before the browser journey').toBeDefined();

  const frequencyMs = binding.frequency_ns / 1_000_000;
  const from = Date.parse(plan.start) - frequencyMs;
  const to = Date.parse(plan.end) + frequencyMs;
  await page.goto(`/a/grafana-synthetic-monitoring-app/checks/${binding.check_id}?from=${from}&to=${to}`);

  await expect(page).toHaveURL(new RegExp(`/a/grafana-synthetic-monitoring-app/checks/${binding.check_id}(?:\\?.*)?$`));
  await expect(page.getByRole('heading', { name: binding.job, exact: true })).toBeVisible();
  await expect(page.getByTestId(SCENES_TEST_ID.timepoint.list)).toBeVisible();

  const bars = page.locator(`[data-testid^="${SCENES_TEST_ID.timepoint.listEntryBar}-"]`);
  await expect.poll(() => bars.count()).toBeGreaterThanOrEqual(history.executions + 2);

  const failureBar = await closestTimepoint(bars, Date.parse(failure!.at), frequencyMs);
  await expect(failureBar).toHaveAttribute('data-status', 'failure');
  await failureBar.click();
  const viewer = page.getByTestId(SCENES_TEST_ID.timepoint.viewer);
  await expect(viewer).toContainText('Check failed');
  await expect(viewer).toContainText('status_code=503');

  const recoveryBar = await closestTimepoint(bars, Date.parse(recovery!.at), frequencyMs);
  await expect(recoveryBar).toHaveAttribute('data-status', 'success');
  await recoveryBar.click();
  await expect(viewer).toContainText('Check succeeded');

  const times = await bars.evaluateAll((elements) =>
    elements.map((element) => Number(element.getAttribute('data-time'))).filter(Number.isFinite)
  );
  expect(times.some((time) => time < Date.parse(plan.cutover))).toBe(true);
  expect(times.some((time) => time >= Date.parse(plan.cutover))).toBe(true);
  expect(binding.probe_ids).toEqual({ 'probe-1': expect.any(Number) });

  await testInfo.attach('hybrid-handoff-dashboard', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});

async function closestTimepoint(bars: Locator, expectedTime: number, toleranceMs: number) {
  const candidates = await bars.evaluateAll((elements) =>
    elements.map((element, index) => ({ index, time: Number(element.getAttribute('data-time')) }))
  );
  const closest = candidates
    .filter((candidate) => Number.isFinite(candidate.time))
    .sort((left, right) => Math.abs(left.time - expectedTime) - Math.abs(right.time - expectedTime))[0];
  expect(closest, `no Timepoint Explorer entry exists near ${new Date(expectedTime).toISOString()}`).toBeDefined();
  expect(Math.abs(closest.time - expectedTime)).toBeLessThanOrEqual(toleranceMs);
  return bars.nth(closest.index);
}
