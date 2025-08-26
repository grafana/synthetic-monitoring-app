import { useTenant } from 'data/useTenant';

// Cutoff date for legacy alerts restriction - users created after this date cannot use legacy alerts
// This aligns with the API-side implementation: maxLegacyAlertsUsageEpoch = 1759276800000000000 (https://github.com/grafana/synthetic-monitoring-api/pull/1501/files#diff-02ac45bc0f26fc51c2e56ea1be760a3b44ed8e2a8a5f728dc7c2f8521d4c49c0R25)
const LEGACY_ALERTS_CUTOFF_DATE = 1759276800; // 2025-10-01 00:00:00 UTC

export function useLegacyAlertsRestriction() {
  const { data: tenant, isLoading, error } = useTenant();

  const isRestricted = (() => {
    if (!tenant?.created) {
      return false;
    }

    return tenant.created > LEGACY_ALERTS_CUTOFF_DATE;
  })();

  return {
    isRestricted,
    isLoading,
    error,
    tenantCreated: tenant?.created,
  };
}
