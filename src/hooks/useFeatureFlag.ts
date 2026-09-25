import { useCallback, useEffect, useState } from 'react';
import { useBooleanFlagValue, useOpenFeatureClient, useOpenFeatureClientStatus } from '@openfeature/react-sdk';
import { type Client, ProviderEvents, ProviderStatus } from '@openfeature/web-sdk';
import { isEqual } from 'lodash';

import { FeatureName } from 'types';

// See docs/development/feature-flags.md
export function useFeatureFlag(featureFlag: FeatureName) {
  const isEnabled = useBooleanFlagValue(featureFlag, false);
  const providerStatus = useOpenFeatureClientStatus();

  return {
    isEnabled,
    // "Ready" means the provider has settled on a final value — including ERROR/FATAL, where
    // flags resolve to defaults — so UI gated on isReady never gets stuck loading when the flag
    // service is unavailable. NOT_READY (the initial pre-resolution state) is the only "not ready" case.
    isReady: providerStatus !== ProviderStatus.NOT_READY,
  };
}

// For call sites that evaluate a dynamic list of flags (e.g. option.featureToggle), where
// useFeatureFlag can't be called per item.
export function useIsFeatureEnabled() {
  const flags = useAllFlags();

  return useCallback((featureFlag: FeatureName) => flags[featureFlag] ?? false, [flags]);
}

type FlagValues = Partial<Record<FeatureName, boolean>>;

// Re-evaluates on every provider event (the react-sdk flag hooks re-read on any status change),
// but only re-renders consumers when a value changes.
function useAllFlags(): FlagValues {
  const client = useOpenFeatureClient();
  const [flags, setFlags] = useState(() => resolveAllFlags(client));

  useEffect(() => {
    const controller = new AbortController();
    const update = () =>
      setFlags((current) => {
        const next = resolveAllFlags(client);
        return isEqual(next, current) ? current : next;
      });

    for (const event of Object.values(ProviderEvents)) {
      client.addHandler(event, update, { signal: controller.signal });
    }

    return () => controller.abort();
  }, [client]);

  return flags;
}

function resolveAllFlags(client: Client): FlagValues {
  const flags: FlagValues = {};

  for (const featureFlag of Object.values(FeatureName)) {
    flags[featureFlag] = client.getBooleanValue(featureFlag, false);
  }

  return flags;
}
