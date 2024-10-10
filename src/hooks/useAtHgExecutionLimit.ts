import { SubscriptionCodeType } from 'data/useGcom.types';

import { useCurrentHGSubscription } from './useCurrentHGSubscription';
import { useMonthlyTotalExecutionCount } from './useMonthlyTotalExecutionCount';

export const FREE_EXECUTION_LIMIT = 100000;

export function useAtHgExecutionLimit() {
  const { data: totalMonthlyChecks, isLoading: isLoadingMonthlyChecks } = useMonthlyTotalExecutionCount();
  const { data, isLoading: isLoadingHGSubscription } = useCurrentHGSubscription();
  const isFree = data === SubscriptionCodeType.FREE;
  const isOverLimit = totalMonthlyChecks >= FREE_EXECUTION_LIMIT;

  return {
    data: isOverLimit && isFree,
    isLoading: isLoadingMonthlyChecks || isLoadingHGSubscription,
    isError: false,
  };
}
