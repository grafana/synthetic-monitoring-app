import { FeatureName } from 'types';
import { useContext } from 'react';
import { FeatureFlagContext } from 'contexts/FeatureFlagContext';

export function useFeatureFlag(featureFlag: FeatureName) {
  const { isFeatureEnabled } = useContext(FeatureFlagContext);
  return {
    isEnabled: isFeatureEnabled(featureFlag),
  };
}
