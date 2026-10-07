import { createOpenFeatureLocalStorageProvider, createOpenFeatureOFREPWebProvider } from '@grafana/runtime';
import { type Client, MultiProvider, OpenFeature } from '@openfeature/web-sdk';
import pluginJson from 'plugin.json';

import { FeatureName } from 'types';

export const SM_OPEN_FEATURE_DOMAIN = pluginJson.id;

// Adding an entry routes all consumers of that FeatureName through OpenFeature instead
// of legacy config.featureToggles. See docs/development/openfeature-migration.md
export const OPEN_FEATURE_KEYS: Partial<Record<FeatureName, string>> = {
  [FeatureName.CALs]: 'synthetic-monitoring.cost-attribution',
  [FeatureName.CheckSuggestions]: 'synthetic-monitoring.check-suggestions',
  [FeatureName.Folders]: 'synthetic-monitoring.folders',
  [FeatureName.GRPCChecks]: 'synthetic-monitoring.grpc-checks',
  [FeatureName.KnowledgeGraph]: 'synthetic-monitoring.knowledge-graph',
  [FeatureName.LabelMigration]: 'synthetic-monitoring.label-migration',
  [FeatureName.Screenshots]: 'synthetic-monitoring.screenshots',
  [FeatureName.SecretsManagement]: 'synthetic-monitoring.secrets-management',
  [FeatureName.TimepointExplorer]: 'synthetic-monitoring.timepoint-explorer',
  [FeatureName.VersionManagement]: 'synthetic-monitoring.version-management',
};

let initPromise: Promise<void> | undefined;
let client: Client | undefined;

export function initOpenFeature(): Promise<void> {
  if (!initPromise) {
    initPromise = doInit().catch((error) => {
      // eslint-disable-next-line no-console
      console.warn(
        `[${SM_OPEN_FEATURE_DOMAIN}] OpenFeature initialization failed; flags routed to OpenFeature will use default values.`,
        error
      );
    });
  }

  return initPromise;
}

async function doInit(): Promise<void> {
  await OpenFeature.setProviderAndWait(
    SM_OPEN_FEATURE_DOMAIN,
    new MultiProvider([
      { provider: createOpenFeatureLocalStorageProvider() },
      { provider: createOpenFeatureOFREPWebProvider() },
    ])
  );

  client = OpenFeature.getClient(SM_OPEN_FEATURE_DOMAIN);
}

// For non-React call sites. Returns defaultValue until initOpenFeature() resolves,
// so avoid module-scope reads (the value would never update).
export function getBooleanFlag(key: string, defaultValue = false): boolean {
  return client?.getBooleanValue(key, defaultValue) ?? defaultValue;
}
