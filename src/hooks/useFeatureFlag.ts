import { useContext } from 'react';

import { FeatureName } from 'types';
import { FeatureFlagContext } from 'contexts/FeatureFlagContext';

export function useFeatureFlag(featureFlag: FeatureName) {
  const { isFeatureEnabled } = useContext(FeatureFlagContext);
  return {
    isEnabled: isFeatureEnabled(featureFlag),
  };
}
