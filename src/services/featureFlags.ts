import { config } from '@grafana/runtime';
import { OFREPWebProvider } from '@openfeature/ofrep-web-provider';
import { type Client, type EvaluationContext, OpenFeature } from '@openfeature/web-sdk';
import pluginJson from 'plugin.json';

import { FeatureName } from 'types';

export const SM_OPEN_FEATURE_DOMAIN = pluginJson.id;

// Adding an entry routes all consumers of that FeatureName through OpenFeature instead
// of legacy config.featureToggles. See docs/development/openfeature-migration.md
export const OPEN_FEATURE_KEYS: Partial<Record<FeatureName, string>> = {};

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
  const baseUrl = `${config.appSubUrl || ''}/apis/features.grafana.app/v0alpha1/namespaces/${config.namespace}`;

  await OpenFeature.setProviderAndWait(
    SM_OPEN_FEATURE_DOMAIN,
    new OFREPWebProvider({
      baseUrl,
      changeDetection: 'none', // flags only re-evaluate on page load
      disableVisibilityRefresh: true,
      cacheMode: 'disabled',
      timeoutMs: 10_000,
    }),
    {
      targetingKey: config.namespace, // evaluate consistently per stack
      namespace: config.namespace, // required by the multi-tenant flag service
      ...((config.openFeatureContext ?? {}) as EvaluationContext),
    }
  );

  client = OpenFeature.getClient(SM_OPEN_FEATURE_DOMAIN);
}

// For non-React call sites. Returns defaultValue until initOpenFeature() resolves,
// so avoid module-scope reads (the value would never update).
export function getBooleanFlag(key: string, defaultValue = false): boolean {
  return client?.getBooleanValue(key, defaultValue) ?? defaultValue;
}
