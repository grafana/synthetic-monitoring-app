import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { matchInstancesToRouteTrees } from '@grafana/alerting';
import type { RoutingTreeList } from '@grafana/alerting/dist/types/grafana/api/notifications/v0alpha1/notifications.api.gen';
import type { Label } from '@grafana/alerting/dist/types/grafana/matchers/types';
import type { InstanceMatchResult } from '@grafana/alerting/dist/types/grafana/notificationPolicies/hooks/useMatchPolicies';
import { config, getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

interface UseMatchInstancesToRouteTreesResult {
  matchInstancesToRouteTrees: ((instances: Label[][]) => InstanceMatchResult[]) | null;
  isLoading: boolean;
  isError: boolean;
  currentData?: RoutingTreeList;
}

/**
 * Hook for useMatchInstancesToRouteTrees that doesn't rely on RTK-Query middleware which breaks if not registered
 * (https://github.com/grafana/grafana/blob/main/packages/grafana-alerting/src/grafana/notificationPolicies/hooks/useMatchPolicies.ts#L47)
 * Uses React Query for caching and getBackendSrv to fetch routing tree data, then uses the standalone matchInstancesToRouteTrees function.
 */
export function useMatchInstancesToRouteTrees(): UseMatchInstancesToRouteTreesResult {
  const namespace = config.namespace;
  const subPath = config.appSubUrl || '';

  const {
    data: routingTreeData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['routingTrees', namespace, subPath],
    queryFn: () => {
      const url = `${subPath}/apis/notifications.alerting.grafana.app/v0alpha1/namespaces/${namespace}/routingtrees`;
      return firstValueFrom(
        getBackendSrv().fetch<RoutingTreeList>({
          method: 'GET',
          url,
        })
      ).then((res) => res.data);
    },
    enabled: Boolean(namespace),
  });

  const matchFunction = useMemo(
    () =>
      routingTreeData?.items
        ? (instances: Label[][]) => matchInstancesToRouteTrees(routingTreeData.items, instances)
        : null,
    [routingTreeData?.items]
  );

  return {
    matchInstancesToRouteTrees: matchFunction,
    isLoading,
    isError,
    currentData: routingTreeData,
  };
}
