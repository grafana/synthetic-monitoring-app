import { getTotalChecksPerMonth } from 'checkUsageCalc';

import { useChecks } from 'data/useChecks';

export function useMonthlyTotalExecutionCount() {
  const { data: checks = [], isLoading, error } = useChecks();

  return {
    data: checks.reduce(
      (total, check) => total + getTotalChecksPerMonth(check.probes.length, check.frequency / 1000),
      0
    ),
    isLoading,
    error,
  };
}
