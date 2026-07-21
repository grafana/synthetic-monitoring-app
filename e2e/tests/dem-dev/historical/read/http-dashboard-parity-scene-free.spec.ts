import { SM_FEATURE_NAMES } from '../../../../../src/services/featureFlags.constants';
import { openSeededCheckDashboard } from '../../../../support/checks';
import { smFeatureProfile } from '../../../../support/dem-dev/featureFlags';
import { expect, test } from '../../../../support/dem-dev/fixtures';

test.use(smFeatureProfile({ [SM_FEATURE_NAMES.SceneFreeHttpDashboard]: true }));

test.describe('v2 HTTP dashboard parity — scene-free dashboard', () => {
  test('renders full-range uptime, reachability, and alert annotations', async ({
    page,
    components,
    scenarioManifest,
  }) => {
    const manifest = scenarioManifest;
    expect(manifest.scenario).toBe('http-dashboard-parity');

    await openSeededCheckDashboard(page, manifest.job);
    const browserTimeZone = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
    await components.timeRangePicker.set({
      from: formatGrafanaInput(Date.parse(manifest.start) - manifest.frequency_ms, browserTimeZone),
      to: formatGrafanaInput(Date.parse(manifest.end) + manifest.frequency_ms, browserTimeZone),
    });

    await expect(page.getByRole('region', { name: 'Uptime' }).getByText('60.77%', { exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Reachability' }).getByText('53.59%', { exact: true })).toBeVisible();

    const alertAnnotations = page.getByRole('button', { name: 'Annotation region' });
    const alertToggle = page.getByRole('switch', { name: 'Show alerts firing' });
    const alertToggleLabel = page.getByText('Show alerts firing', { exact: true });
    await expect(alertAnnotations).not.toHaveCount(0);

    await alertToggleLabel.click();
    await expect(alertToggle).not.toBeChecked();
    await expect(alertAnnotations).toHaveCount(0);

    await alertToggleLabel.click();
    await expect(alertToggle).toBeChecked();
    await expect(alertAnnotations).not.toHaveCount(0);
  });

  test('renders the qualitative health changes across the seeded incident', async ({
    page,
    components,
    scenarioManifest,
  }) => {
    test.setTimeout(180_000);

    const manifest = scenarioManifest;
    const start = Date.parse(manifest.start);
    const browserTimeZone = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
    const phases = [
      { name: 'healthy baseline', fromMinutes: 5, toMinutes: 30, uptime: '100.00%', reachability: '100.00%' },
      {
        name: 'regional isolation',
        fromMinutes: 41,
        toMinutes: 67,
        uptime: '100.00%',
        reachability: '66.67%',
      },
      { name: 'fleet-wide outage', fromMinutes: 77, toMinutes: 103, uptime: '0.00%', reachability: '0.00%' },
      {
        name: 'content and transport regression',
        fromMinutes: 113,
        toMinutes: 139,
        uptime: '0.00%',
        reachability: '0.00%',
      },
      { name: 'recovery', fromMinutes: 149, toMinutes: 175, uptime: '100.00%', reachability: '100.00%' },
    ];

    await openSeededCheckDashboard(page, manifest.job);

    for (const phase of phases) {
      await test.step(phase.name, async () => {
        await components.timeRangePicker.set({
          from: formatGrafanaInput(start + phase.fromMinutes * 60_000, browserTimeZone),
          to: formatGrafanaInput(start + phase.toMinutes * 60_000, browserTimeZone),
        });

        await expect(page.getByRole('region', { name: 'Uptime' })).toContainText(phase.uptime);
        await expect(page.getByRole('region', { name: 'Reachability' })).toContainText(phase.reachability);
      });
    }
  });
});

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
