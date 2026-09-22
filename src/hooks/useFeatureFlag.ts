import { useCallback, useEffect, useState } from 'react';
import { useBooleanFlagDetails, useOpenFeatureClient, useOpenFeatureClientStatus } from '@openfeature/react-sdk';
import { type Client, ProviderEvents, ProviderStatus } from '@openfeature/web-sdk';
import { isEqual } from 'lodash';
import { OPEN_FEATURE_KEYS } from 'services/featureFlags';

import { FeatureName } from 'types';

import { useFeatureFlagContext } from './useFeatureFlagContext';

// Sentinel for unmapped flags, since hooks can't be called conditionally
const UNMAPPED_FLAG_KEY = 'sm-unmapped-flag';

// Mapped flags evaluate through OpenFeature. Unmapped flags, and mapped flags OpenFeature can't
// resolve (no GOFF definition in this wave yet, provider not ready or unavailable), read legacy
// config.featureToggles. See docs/development/openfeature-migration.md.
export function useFeatureFlag(featureFlag: FeatureName) {
  const { isFeatureEnabled } = useFeatureFlagContext();
  const openFeatureKey = OPEN_FEATURE_KEYS[featureFlag];
  const details = useBooleanFlagDetails(openFeatureKey ?? UNMAPPED_FLAG_KEY, false);
  const providerStatus = useOpenFeatureClientStatus();

  const isMapped = openFeatureKey !== undefined;

  return {
    isEnabled: isMapped && !details.errorCode ? details.value : isFeatureEnabled(featureFlag),
    // Legacy flags resolve synchronously. For mapped flags, "ready" means the provider has
    // settled on a final value — including ERROR/FATAL, where it falls back to defaults — so
    // UI gated on isReady never gets stuck loading when the flag service is unavailable.
    // NOT_READY (the initial pre-resolution state) is the only "not ready" case.
    isReady: isMapped ? providerStatus !== ProviderStatus.NOT_READY : true,
  };
}

// For call sites that evaluate a dynamic list of flags (e.g. option.featureToggle), where
// useFeatureFlag can't be called per item. Same resolution rules as useFeatureFlag.
export function useIsFeatureEnabled() {
  const { isFeatureEnabled } = useFeatureFlagContext();
  const resolvedFlags = useResolvedOpenFeatureFlags();

  return useCallback(
    (featureFlag: FeatureName) => {
      const openFeatureKey = OPEN_FEATURE_KEYS[featureFlag];
      const resolved = openFeatureKey === undefined ? undefined : resolvedFlags[openFeatureKey];

      return resolved ?? isFeatureEnabled(featureFlag);
    },
    [resolvedFlags, isFeatureEnabled]
  );
}

type ResolvedFlags = Record<string, boolean | undefined>;

// undefined = OpenFeature couldn't resolve the key. Re-evaluates on the same provider events
// the react-sdk flag hooks do, but only re-renders consumers when a value changes.
function useResolvedOpenFeatureFlags(): ResolvedFlags {
  const client = useOpenFeatureClient();
  const [resolvedFlags, setResolvedFlags] = useState(() => resolveMappedFlags(client));

  useEffect(() => {
    const controller = new AbortController();
    const update = () =>
      setResolvedFlags((current) => {
        const next = resolveMappedFlags(client);
        return isEqual(next, current) ? current : next;
      });

    client.addHandler(ProviderEvents.Ready, update, { signal: controller.signal });
    client.addHandler(ProviderEvents.ContextChanged, update, { signal: controller.signal });
    client.addHandler(ProviderEvents.ConfigurationChanged, update, { signal: controller.signal });

    return () => controller.abort();
  }, [client]);

  return resolvedFlags;
}

function resolveMappedFlags(client: Client): ResolvedFlags {
  const resolved: ResolvedFlags = {};

  for (const openFeatureKey of Object.values(OPEN_FEATURE_KEYS)) {
    if (openFeatureKey !== undefined) {
      const details = client.getBooleanDetails(openFeatureKey, false);
      resolved[openFeatureKey] = details.errorCode ? undefined : details.value;
    }
  }

  return resolved;
}
