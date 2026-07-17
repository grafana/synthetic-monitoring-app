import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@grafana/plugin-e2e';

interface ProbeManifest {
  executions: number;
}

interface ScenarioManifest {
  scenario: string;
  job: string;
  target: string;
  frequency_ms: number;
  probes: Record<string, ProbeManifest>;
  aggregate: {
    executions: number;
    reachability: number;
    uptime: number;
  };
}

const manifestPath = resolve(process.env.DEM_SCENARIO_MANIFEST ?? 'artifacts/dem-dev/scenario.json');

function readScenarioManifest(): ScenarioManifest {
  let parsed: unknown;

  try {
    parsed = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read the dem-dev scenario manifest at ${manifestPath}`, { cause: error });
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('job' in parsed) ||
    typeof parsed.job !== 'string' ||
    !('target' in parsed) ||
    typeof parsed.target !== 'string' ||
    !('frequency_ms' in parsed) ||
    typeof parsed.frequency_ms !== 'number' ||
    !('probes' in parsed) ||
    typeof parsed.probes !== 'object' ||
    parsed.probes === null
  ) {
    throw new Error(`The dem-dev scenario manifest at ${manifestPath} does not match the expected contract`);
  }

  return parsed as ScenarioManifest;
}

test.describe('dem-dev scenario conformance', () => {
  const manifest = readScenarioManifest();

  test('lists the scenario-defined check and opens its dashboard', async ({ page }) => {
    await page.goto(`/a/grafana-synthetic-monitoring-app/checks?view=card&search=${encodeURIComponent(manifest.job)}`);

    const checkCard = page
      .getByTestId('checks card')
      .filter({ has: page.getByRole('heading', { name: manifest.job, exact: true }) });

    await expect(checkCard).toHaveCount(1);
    await expect(checkCard).toContainText(manifest.target);
    await expect(checkCard).toContainText(`${manifest.frequency_ms / 1000}s frequency`);

    const probeCount = Object.keys(manifest.probes).length;
    await expect(checkCard).toContainText(`${probeCount} ${probeCount === 1 ? 'location' : 'locations'}`);

    await checkCard.getByRole('link', { name: 'View dashboard' }).click();

    await expect(page).toHaveURL(/\/a\/grafana-synthetic-monitoring-app\/checks\/\d+\/?(?:\?.*)?$/);
    await expect(page.getByText('Uptime', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Reachability', { exact: true }).first()).toBeVisible();
  });
});
