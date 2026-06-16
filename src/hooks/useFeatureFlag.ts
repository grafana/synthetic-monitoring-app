import { useBooleanFlagValue } from '@openfeature/react-sdk';
import { OPEN_FEATURE_KEYS } from 'services/featureFlags';

import { FeatureName } from 'types';

import { useFeatureFlagContext } from './useFeatureFlagContext';

// Sentinel for unmapped flags, since hooks can't be called conditionally
const UNMAPPED_FLAG_KEY = 'sm-unmapped-flag';

// Mapped flags evaluate through OpenFeature; the rest fall through to legacy
// config.featureToggles. See docs/development/openfeature-migration.md.
export function useFeatureFlag(featureFlag: FeatureName) {
  const { isFeatureEnabled } = useFeatureFlagContext();
  const openFeatureKey = OPEN_FEATURE_KEYS[featureFlag];
  const openFeatureValue = useBooleanFlagValue(openFeatureKey ?? UNMAPPED_FLAG_KEY, false);

  return {
    isEnabled: openFeatureKey !== undefined ? openFeatureValue : isFeatureEnabled(featureFlag),
  };
}
