import { config } from '@grafana/runtime';
import type { Client, EvaluationContext } from '@openfeature/web-sdk';
import pluginJson from 'plugin.json';

// Loaded at plugin preload time on every Grafana page — keep the import graph
// slim (no types.ts, no SDK statics). OPEN_FEATURE_KEYS lives in openFeatureKeys.ts for this reason.

// The plugin-scoped domain isolates our flags from Grafana core and other plugins.
export const SM_OPEN_FEATURE_DOMAIN = pluginJson.id;

let initPromise: Promise<void> | undefined;
let client: Client | undefined;

/**
 * Memoized and safe to fail: without the feature flag service (e.g. OSS Grafana)
 * flags fall back to legacy values / defaults.
 */
export function initOpenFeature(): Promise<void> {
  if (!initPromise) {
    initPromise = doInit().catch((error) => {
      // eslint-disable-next-line no-console
      console.warn(
        `[${pluginJson.id}] OpenFeature initialization failed; flags routed to OpenFeature will use default values.`,
        error
      );
    });
  }

  return initPromise;
}

async function doInit(): Promise<void> {
  const [{ OpenFeature }, { OFREPWebProvider }] = await Promise.all([
    import('@openfeature/web-sdk'),
    import('@openfeature/ofrep-web-provider'),
  ]);

  const baseUrl = `${config.appSubUrl || ''}/apis/features.grafana.app/v0alpha1/namespaces/${config.namespace}`;

  await OpenFeature.setProviderAndWait(
    SM_OPEN_FEATURE_DOMAIN,
    new OFREPWebProvider({
      baseUrl,
      changeDetection: 'none', // flags only re-evaluate on page load
      disableVisibilityRefresh: true,
      cacheMode: 'disabled', // no localStorage persistence
      timeoutMs: 10_000,
    }),
    {
      targetingKey: config.namespace, // flags evaluate consistently per stack
      namespace: config.namespace, // required by the multi-tenant feature flag service
      ...((config.openFeatureContext ?? {}) as EvaluationContext),
    }
  );

  client = OpenFeature.getClient(SM_OPEN_FEATURE_DOMAIN);
}

/**
 * For non-React call sites. Returns `defaultValue` until `initOpenFeature()`
 * has resolved, so avoid module-scope reads (the value would never update).
 */
export function getBooleanFlag(key: string, defaultValue = false): boolean {
  return client?.getBooleanValue(key, defaultValue) ?? defaultValue;
}
