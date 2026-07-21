import { QueryClient } from '@tanstack/react-query';

import { dashboardQueryKeyPrefix, DashboardQueryScope } from './dashboardQueryKeys';

export const DASHBOARD_QUERY_STALE_TIME_MS = 30_000;

export function invalidateDashboardScope(queryClient: QueryClient, scope: DashboardQueryScope) {
  return queryClient.invalidateQueries({
    queryKey: [...dashboardQueryKeyPrefix(scope)],
  });
}

export function createDashboardQueryOptions<TQueryFnData, TData = TQueryFnData>({
  scope,
  queryKey,
  queryFn,
  select,
}: {
  scope: DashboardQueryScope;
  queryKey: readonly unknown[];
  queryFn: () => Promise<TQueryFnData>;
  select?: (data: TQueryFnData) => TData;
}) {
  return {
    queryKey: [...dashboardQueryKeyPrefix(scope), ...queryKey],
    queryFn,
    staleTime: DASHBOARD_QUERY_STALE_TIME_MS,
    select,
    meta: {
      dashboardScope: scope,
    },
  };
}
