import { QueryKey } from '@tanstack/query-core';
import { useQuery } from '@tanstack/react-query';

import { FeatureName } from 'types';
import { ONE_SECOND_IN_MS } from 'utils.constants';
import { ListTenantCostAttributionLabelsResponse } from 'datasource/responses.types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
// TODO: Re-enable once backend is available
// import { useSMDS } from 'hooks/useSMDS';

export const CAL_REFETCH_INTERVAL = 10 * ONE_SECOND_IN_MS;

// TODO: Remove once backend is available
const MOCK_CAL_RESPONSE: ListTenantCostAttributionLabelsResponse = {
  items: ['Team', 'Service'],
};

export const QUERY_KEYS: Record<'list', QueryKey> = {
  list: ['tenantCostAttributionLabels'],
};

export function useTenantCostAttributionLabels() {
  const { isEnabled: isCALsEnabled } = useFeatureFlag(FeatureName.CALs);

  // TODO: Re-enable once backend is available
  // const smDS = useSMDS();

  return useQuery({
    queryKey: QUERY_KEYS.list,
    // TODO: Replace with smDS.getTenantCostAttributionLabels() once backend is available
    queryFn: () => Promise.resolve(MOCK_CAL_RESPONSE),
    refetchInterval: CAL_REFETCH_INTERVAL,
    enabled: isCALsEnabled,
  });
}
