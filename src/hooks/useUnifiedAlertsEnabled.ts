import { config } from '@grafana/runtime';

import { FeatureName } from 'types';

import { useFeatureFlag } from './useFeatureFlag';

export default function useUnifiedAlertsEnabled() {
  const { isEnabled: isEnabledByFF } = useFeatureFlag(FeatureName.UnifiedAlerting);

  return isEnabledByFF || config.unifiedAlertingEnabled;
}
