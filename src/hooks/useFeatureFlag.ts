import { useBooleanFlagValue, useOpenFeatureClientStatus } from '@openfeature/react-sdk';
import { ProviderStatus } from '@openfeature/web-sdk';
import { OPEN_FEATURE_KEYS } from 'services/featureFlags';
import type { SmFeatureName } from 'services/featureFlags.constants';

import { FeatureName } from 'types';

import { useFeatureFlagContext } from './useFeatureFlagContext';

// Sentinel for unmapped flags, since hooks can't be called conditionally
const UNMAPPED_FLAG_KEY = 'sm-unmapped-flag';

// Mapped flags evaluate through OpenFeature; the rest fall through to legacy
// config.featureToggles. See docs/development/openfeature-migration.md.
export function useFeatureFlag(featureFlag: FeatureName) {
  const { isFeatureEnabled } = useFeatureFlagContext();
  const openFeatureKey = OPEN_FEATURE_KEYS[featureFlag as SmFeatureName];
  const openFeatureValue = useBooleanFlagValue(openFeatureKey ?? UNMAPPED_FLAG_KEY, false);
  const providerStatus = useOpenFeatureClientStatus();

  const isMapped = openFeatureKey !== undefined;

  return {
    isEnabled: isMapped ? openFeatureValue : isFeatureEnabled(featureFlag),
    // Legacy flags resolve synchronously. For mapped flags, "ready" means the provider has
    // settled on a final value — including ERROR/FATAL, where it falls back to defaults — so
    // UI gated on isReady never gets stuck loading when the flag service is unavailable.
    // NOT_READY (the initial pre-resolution state) is the only "not ready" case.
    isReady: isMapped ? providerStatus !== ProviderStatus.NOT_READY : true,
  };
}
