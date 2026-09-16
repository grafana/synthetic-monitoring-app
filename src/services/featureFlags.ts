import { urlUtil } from '@grafana/data';
import { config } from '@grafana/runtime';
import { OFREPWebProvider } from '@openfeature/ofrep-web-provider';
import { type Client, type EvaluationContext, OpenFeature } from '@openfeature/web-sdk';
import { invert, isArray } from 'lodash';
import pluginJson from 'plugin.json';

import { FeatureName } from 'types';

export const SM_OPEN_FEATURE_DOMAIN = pluginJson.id;

// Adding an entry routes all consumers of that FeatureName through OpenFeature instead
// of legacy config.featureToggles. See docs/development/openfeature-migration.md
export const OPEN_FEATURE_KEYS: Partial<Record<FeatureName, string>> = {
  [FeatureName.CheckSuggestions]: 'synthetic-monitoring.check-suggestions',
};

const FEATURE_NAME_BY_OPEN_FEATURE_KEY: Record<string, string | undefined> = invert(OPEN_FEATURE_KEYS);

// Repeat the key for several flags: `?features=a&features=b`
export function isFeatureEnabledThroughUrl(...names: string[]) {
  const featuresParam = urlUtil.getUrlSearchParams()['features'];

  if (!isArray(featuresParam)) {
    return false;
  }

  const urlFeatures = featuresParam as string[];

  return names.some((name) => urlFeatures.includes(name));
}

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
  const featureName = FEATURE_NAME_BY_OPEN_FEATURE_KEY[key];

  if (isFeatureEnabledThroughUrl(key, ...(featureName ? [featureName] : []))) {
    return true;
  }

  return client?.getBooleanValue(key, defaultValue) ?? defaultValue;
}
