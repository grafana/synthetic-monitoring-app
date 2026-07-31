import { FeatureName } from 'types';
import { useTenantCostAttributionLabels } from 'data/useTenantCostAttributionLabels';
import { useFeatureFlag } from 'hooks/useFeatureFlag';

// Self-contained so each nudge can decide its own visibility without prop threading.
// The underlying query is deduped by react-query, so calling this per check list item is cheap.
export function useCostAttributionSetupStatus() {
  const { isEnabled: isCALsEnabled } = useFeatureFlag(FeatureName.CALs);
  const { data } = useTenantCostAttributionLabels();
  const calNames = isCALsEnabled ? (data?.names ?? []) : [];

  return {
    isCALsEnabled,
    calNames,
    // Only true once the query has succeeded with an empty list — while loading or on
    // error, data is undefined, so tenants that do have CALs configured never see setup
    // nudges because of a failed fetch.
    needsSetup: isCALsEnabled && data !== undefined && data.names.length === 0,
  };
}
