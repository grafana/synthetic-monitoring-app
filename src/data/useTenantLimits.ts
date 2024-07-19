import { QueryKey } from '@tanstack/query-core';
import { useQuery } from '@tanstack/react-query';

import { useSyntheticMonitoringDS } from './useSyntheticMonitoringDS';

export const queryKeys: Record<'list', QueryKey> = {
  list: ['tenantLimits'],
};

export function useTenantLimits() {
  const smDS = useSyntheticMonitoringDS();

  return useQuery({
    queryKey: queryKeys.list,
    queryFn: () => smDS.getTenantLimits(),
  });
}
