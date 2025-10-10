import { useMemo } from 'react';

import { CheckTypeGroup } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';

import { CHECK_TYPE_GROUP_OPTIONS_MAP, CHECK_TYPE_OPTION_MAP } from '../constants';

// TODO: make dumber. Only protocol checks use this hook.
export function useCheckTypeOptions(checkTypeGroup?: CheckTypeGroup) {
  return useMemo(() => {
    return Object.values(CHECK_TYPE_OPTION_MAP).filter((option) => {
      if (option.featureToggle && !isFeatureEnabled(option.featureToggle)) {
        return false;
      }

      if (checkTypeGroup && option.group !== checkTypeGroup) {
        return false;
      }

      const group = CHECK_TYPE_GROUP_OPTIONS_MAP[option.group];

      return !(group && 'featureToggle' in group && group.featureToggle && !isFeatureEnabled(group.featureToggle));
    });
  }, [checkTypeGroup]);
}
