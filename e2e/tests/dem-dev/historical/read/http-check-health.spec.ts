import { SM_FEATURE_NAMES } from '../../../../../src/services/featureFlags.constants';
import { openSeededCheckDashboard } from '../../../../support/checks';
import { smFeatureProfile } from '../../../../support/dem-dev/featureFlags';
import { expect, test } from '../../../../support/dem-dev/fixtures';
import type { ScenarioManifest } from '../../../../support/dem-dev/scenarioManifest';

test.use(smFeatureProfile({ [SM_FEATURE_NAMES.SceneFreeHttpDashboard]: true }));

test.describe('HTTP check health evidence', () => {
  test('guides diagnosis from new history through incident and recovery', async ({
    page,
    components,
    scenarioManifest,
  }) => {
    test.setTimeout(180_000);

    expect(scenarioManifest.scenario).toBe('http-check-health');

    await openSeededCheckDashboard(page, scenarioManifest.job);
    const browserTimeZone = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
    const health = page.getByRole('status', { name: 'Check health' });

    await test.step('new check history cannot establish normal yet', async () => {
      await setManifestRange(components.timeRangePicker, scenarioManifest, 0.001, 0.02, browserTimeZone);

      await expect(health).toContainText('Healthy at end of range');
      await expect(health).toContainText('Normal not established yet');
    });

    await test.step('stable history is within its learned baseline', async () => {
      await setManifestRange(components.timeRangePicker, scenarioManifest, 0.5, 0.6, browserTimeZone);

      await expect(health).toContainText('Healthy at end of range');
      await expect(health).toContainText('Within normal range');
      await expect(page.getByRole('button', { name: 'Set up alert for Average latency' })).toBeVisible();
      await expect(page.getByRole('img', { name: 'Alert configured for Reachability' })).toBeVisible();
      await expect(page.getByRole('img', { name: 'Alert configured for SSL expiry' })).toBeVisible();
    });

    await test.step('latency regression is explained by the learned baseline', async () => {
      await setManifestRange(components.timeRangePicker, scenarioManifest, 0.81, 0.85, browserTimeZone);

      await expect(health).toContainText('Unhealthy at end of range');
      await expect(health).toContainText('Well above normal');
    });

    await test.step('failed executions are explained by alert history', async () => {
      await setManifestRange(components.timeRangePicker, scenarioManifest, 0.87, 0.91, browserTimeZone);

      const reachability = page.getByRole('region', { name: 'Reachability' });

      await expect(health).toContainText('Unhealthy at end of range');
      await expect(health).toContainText('Reachability alert was still firing when this range ended');
      await expect(reachability.getByRole('status', { name: 'Reachability trend' })).toContainText(
        'Unavailable throughout this range'
      );
      await expect(page.getByRole('img', { name: 'Alert fired in this range for Reachability' })).toBeVisible();
      await expect(page.getByRole('img', { name: 'Alert configured for SSL expiry' })).toBeVisible();
    });

    await test.step('recovery preserves the incident while describing health at the range end', async () => {
      await setManifestRange(components.timeRangePicker, scenarioManifest, 0.84, 0.98, browserTimeZone);
      const reachability = page.getByRole('region', { name: 'Reachability' });
      const reachabilityValue = reachability.locator('strong').first();

      await expect(health).toContainText('Healthy at end of range');
      await expect(health).toContainText('Reachability was critical earlier in this range');
      await expect(reachability.getByRole('status', { name: 'Reachability trend' })).toContainText(
        'Recovered before the range ended'
      );
      await expect(reachabilityValue).toHaveCSS('color', 'rgb(255, 82, 134)');
    });
  });
});

async function setManifestRange(
  timeRangePicker: {
    set: (range: { from: string; to: string }) => Promise<void>;
  },
  manifest: ScenarioManifest,
  fromProgress: number,
  toProgress: number,
  timeZone: string
) {
  const start = Date.parse(manifest.start);
  const duration = Date.parse(manifest.end) - start;

  await timeRangePicker.set({
    from: formatGrafanaInput(start + duration * fromProgress, timeZone),
    to: formatGrafanaInput(start + duration * toProgress, timeZone),
  });
}

function formatGrafanaInput(value: number, timeZone: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value));
}
