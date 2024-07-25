import { QueryKey } from '@tanstack/query-core';
import { useQuery } from '@tanstack/react-query';

import { useSMDS } from 'hooks/useSMDS';

export const queryKeys: Record<'list', QueryKey> = {
  list: ['tenantLimits'],
};

export function useTenantLimits() {
  const smDS = useSMDS();

  return useQuery({
    queryKey: queryKeys.list,
    queryFn: () => smDS.getTenantLimits(),
  });
}
