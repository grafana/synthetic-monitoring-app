import { QueryKey } from '@tanstack/query-core';
import { useQuery } from '@tanstack/react-query';

import { useSMDS } from 'hooks/useSMDS';

export const QUERY_KEYS: Record<'list', QueryKey> = {
  list: ['tenantLimits'],
};

export function useTenantLimits() {
  const smDS = useSMDS();

  return useQuery({
    queryKey: QUERY_KEYS.list,
    queryFn: () => smDS.getTenantLimits(),
  });
}
