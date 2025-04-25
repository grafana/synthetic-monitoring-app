import { getTotalChecksPerMonth } from 'checkUsageCalc';

import { useChecks } from 'data/useChecks';

export function useMonthlyTotalExecutionCount() {
  const { data: checks = [], isLoading, error } = useChecks();

  const data = checks
    .filter((check) => check.enabled)
    .reduce((total, check) => total + getTotalChecksPerMonth(check.probes.length, check.frequency), 0);

  return {
    data,
    isLoading,
    error,
  };
}
