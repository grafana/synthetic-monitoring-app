import { FeatureName } from 'types';

import { useFeatureFlagContext } from './useFeatureFlagContext';

export function useFeatureFlag(featureFlag: FeatureName) {
  const { isFeatureEnabled } = useFeatureFlagContext();
  return {
    isEnabled: isFeatureEnabled(featureFlag),
  };
}
