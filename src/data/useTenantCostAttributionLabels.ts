import { QueryKey } from '@tanstack/query-core';
import { useQuery } from '@tanstack/react-query';

import { ONE_SECOND_IN_MS } from 'utils.constants';
import { useSMDS } from 'hooks/useSMDS';

export const CAL_REFETCH_INTERVAL = 30 * ONE_SECOND_IN_MS;

export const QUERY_KEYS: Record<'list', QueryKey> = {
  list: ['tenantCostAttributionLabels'],
};

export function useTenantCostAttributionLabels() {
  const smDS = useSMDS();

  return useQuery({
    queryKey: QUERY_KEYS.list,
    queryFn: () => smDS.getTenantCostAttributionLabels(),
    refetchInterval: CAL_REFETCH_INTERVAL,
  });
}
