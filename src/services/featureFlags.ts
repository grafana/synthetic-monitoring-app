import { createOpenFeatureLocalStorageProvider, createOpenFeatureOFREPWebProvider } from '@grafana/runtime';
import { type Client, MultiProvider, OpenFeature, ProviderEvents } from '@openfeature/web-sdk';
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
let localStorageProvider: ReturnType<typeof createOpenFeatureLocalStorageProvider> | undefined;

// Must match the prefix of Grafana's own localStorage provider, which createOpenFeatureLocalStorageProvider proxies.
const BROWSER_OVERRIDE_PREFIX = 'grafana.openfeature.';

// Grafana's provider has no public setter, so overrides are written to localStorage directly.
export const getBrowserFlagOverrideStorageKey = (key: string) => `${BROWSER_OVERRIDE_PREFIX}${key}`;

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
  localStorageProvider = createOpenFeatureLocalStorageProvider();

  await OpenFeature.setProviderAndWait(
    SM_OPEN_FEATURE_DOMAIN,
    new MultiProvider([{ provider: localStorageProvider }, { provider: createOpenFeatureOFREPWebProvider() }])
  );

  client = OpenFeature.getClient(SM_OPEN_FEATURE_DOMAIN);
}

// For non-React call sites. Returns defaultValue until initOpenFeature() resolves,
// so avoid module-scope reads (the value would never update).
export function getBooleanFlag(key: string, defaultValue = false): boolean {
  return client?.getBooleanValue(key, defaultValue) ?? defaultValue;
}

export function getBrowserFlagOverride(key: string): boolean | undefined {
  const value = localStorage.getItem(getBrowserFlagOverrideStorageKey(key));

  return value === 'true' ? true : value === 'false' ? false : undefined;
}

// Overrides this browser only, ahead of the rollout value. Pass undefined to remove the override.
export function setBrowserFlagOverride(key: string, value: boolean | undefined): void {
  const storageKey = getBrowserFlagOverrideStorageKey(key);

  if (value === undefined) {
    localStorage.removeItem(storageKey);
  } else {
    localStorage.setItem(storageKey, String(value));
  }

  // Writing localStorage emits nothing, so signal the change; MultiProvider forwards it to
  // the client, which makes useIsFeatureEnabled re-evaluate without a reload.
  localStorageProvider?.events.emit(ProviderEvents.ConfigurationChanged, {
    message: 'Browser flag override changed',
    flagsChanged: [key],
  });
}
