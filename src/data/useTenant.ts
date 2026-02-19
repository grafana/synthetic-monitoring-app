import { QueryKey, useQuery } from '@tanstack/react-query';

import { useSMDS } from 'hooks/useSMDS';

export const QUERY_KEYS: Record<'tenant', QueryKey> = {
  tenant: ['tenant'],
};

export function useTenant() {
  const smDS = useSMDS();

  return useQuery({
    queryKey: QUERY_KEYS.tenant,
    queryFn: () => smDS.getTenant(),
  });
}
