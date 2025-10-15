import { QueryKey, useQuery } from '@tanstack/react-query';

import { useSMDS } from 'hooks/useSMDS';

export const queryKeys: Record<'tenant', QueryKey> = {
  tenant: ['tenant'],
};

export function useTenant() {
  const smDS = useSMDS();

  return useQuery({
    queryKey: queryKeys.tenant,
    queryFn: () => smDS.getTenant(),
  });
}
