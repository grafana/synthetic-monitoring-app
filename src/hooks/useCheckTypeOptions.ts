import { useMemo } from 'react';

import { CHECK_TYPE_OPTIONS } from './useCheckTypeOptions.constants';
import { useIsFeatureEnabled } from './useFeatureFlag';

/**
 * Returns options for all checks (unless disabled by featureToggle)
 */
export function useCheckTypeOptions() {
  const isFeatureEnabled = useIsFeatureEnabled();

  return useMemo(
    () =>
      CHECK_TYPE_OPTIONS.filter(
        (option) => !option.featureToggle || (option.featureToggle && isFeatureEnabled(option.featureToggle))
      ),
    [isFeatureEnabled]
  );
}
