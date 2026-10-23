import { createOpenFeatureLocalStorageProvider, createOpenFeatureOFREPWebProvider } from '@grafana/runtime';
import { type Client, MultiProvider, OpenFeature } from '@openfeature/web-sdk';
import pluginJson from 'plugin.json';

export const SM_OPEN_FEATURE_DOMAIN = pluginJson.id;

let initPromise: Promise<void> | undefined;
let initialised = false;
let client: Client | undefined;

export function initOpenFeature(): Promise<void> {
  if (!initPromise) {
    initPromise = doInit()
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.warn(
          `[${SM_OPEN_FEATURE_DOMAIN}] OpenFeature initialization failed; flags will use default values.`,
          error
        );
      })
      .finally(() => {
        initialised = true;
      });
  }

  return initPromise;
}

// True once initOpenFeature() has settled, successfully or not
export function isOpenFeatureInitialised(): boolean {
  return initialised;
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
