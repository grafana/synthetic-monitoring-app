import { useContext } from 'react';

import { FeatureFlagContext } from 'contexts/FeatureFlagContext';
import { CHECK_TYPE_OPTIONS } from 'components/constants';

export function useCheckTypeOptions() {
  const { isFeatureEnabled } = useContext(FeatureFlagContext);

  return CHECK_TYPE_OPTIONS.filter((option) => {
    if (option.featureToggle) {
      return isFeatureEnabled(option.featureToggle);
    }

    return true;
  });
}
