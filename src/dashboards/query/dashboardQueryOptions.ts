import { QueryClient,QueryFunctionContext } from '@tanstack/react-query';

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
  enabled,
}: {
  scope: DashboardQueryScope;
  queryKey: readonly unknown[];
  queryFn: (context: QueryFunctionContext) => Promise<TQueryFnData>;
  select?: (data: TQueryFnData) => TData;
  enabled?: boolean;
}) {
  return {
    queryKey: [...dashboardQueryKeyPrefix(scope), ...queryKey],
    queryFn,
    staleTime: DASHBOARD_QUERY_STALE_TIME_MS,
    select,
    enabled,
    meta: {
      dashboardScope: scope,
    },
  };
}
