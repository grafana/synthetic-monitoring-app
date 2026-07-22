import { expect, test as base } from '@grafana/plugin-e2e';

import { readScenarioManifest, type ScenarioManifest } from './scenarioManifest';
import { readHybridRunManifest, type HybridRunManifest } from './hybridRunManifest';

interface DemDevFixtures {
  hybridRunManifest: HybridRunManifest;
  scenarioManifest: ScenarioManifest;
}

/**
 * Loads runtime artifacts only when a journey starts. Keeping artifact access
 * in a fixture means Playwright can discover and list tests before dem-dev has
 * started or seeded a scenario.
 */
export const test = base.extend<DemDevFixtures>({
  hybridRunManifest: async ({}, use) => {
    await use(readHybridRunManifest());
  },
  scenarioManifest: async ({}, use) => {
    await use(readScenarioManifest());
  },
});

export { expect };
