import { QueryKey } from '@tanstack/query-core';
import { useQuery } from '@tanstack/react-query';

import { ONE_SECOND_IN_MS } from 'utils.constants';
import { ListTenantCostAttributionLabelsResponse } from 'datasource/responses.types';
// TODO: Re-enable once backend is available
// import { useSMDS } from 'hooks/useSMDS';

export const CAL_REFETCH_INTERVAL = 10 * ONE_SECOND_IN_MS;

// TODO: Remove once backend is available
const MOCK_CAL_RESPONSE: ListTenantCostAttributionLabelsResponse = {
  items: ['CAL001', 'CAL002', 'CAL003'],
};

export const QUERY_KEYS: Record<'list', QueryKey> = {
  list: ['tenantCostAttributionLabels'],
};

export function useTenantCostAttributionLabels() {
  // TODO: Re-enable once backend is available
  // const smDS = useSMDS();

  return useQuery({
    queryKey: QUERY_KEYS.list,
    // TODO: Replace with smDS.getTenantCostAttributionLabels() once backend is available
    queryFn: () => Promise.resolve(MOCK_CAL_RESPONSE),
    refetchInterval: CAL_REFETCH_INTERVAL,
  });
}
