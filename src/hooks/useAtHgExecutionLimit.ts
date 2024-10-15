import { config } from '@grafana/runtime';

import { useMonthlyTotalExecutionCount } from './useMonthlyTotalExecutionCount';

export const FREE_EXECUTION_LIMIT = 100000;

export function useAtHgExecutionLimit() {
  const { data: totalMonthlyChecks, isLoading: isLoadingMonthlyChecks } = useMonthlyTotalExecutionCount();
  // @ts-expect-error - Cloud Free is not defined in the config but it is what is present for Free trial accounts and free tier accounts
  const isFree = config.buildInfo.edition === `Cloud Free`;
  const isOverLimit = totalMonthlyChecks >= FREE_EXECUTION_LIMIT;

  return {
    data: isOverLimit && isFree,
    isLoading: isLoadingMonthlyChecks,
    isError: false,
  };
}
