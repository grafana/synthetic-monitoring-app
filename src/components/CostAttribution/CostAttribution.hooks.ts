import { FeatureName } from 'types';
import { useTenantCostAttributionLabels } from 'data/useTenantCostAttributionLabels';
import { useFeatureFlag } from 'hooks/useFeatureFlag';

// Self-contained so each nudge can decide its own visibility without prop threading.
// The underlying query is deduped by react-query, so calling this per check list item is cheap.
export function useCostAttributionSetupStatus() {
  const { isEnabled: isCALsEnabled } = useFeatureFlag(FeatureName.CALs);
  const { data, isLoading } = useTenantCostAttributionLabels();
  const calNames = isCALsEnabled ? (data?.names ?? []) : [];

  return {
    isCALsEnabled,
    calNames,
    // Never true while loading, so nudges don't flash for tenants that have CALs configured.
    needsSetup: isCALsEnabled && !isLoading && calNames.length === 0,
  };
}
