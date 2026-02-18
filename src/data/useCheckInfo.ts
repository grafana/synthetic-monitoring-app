import { type QueryKey, useQuery } from '@tanstack/react-query';

import { useSMDS } from 'hooks/useSMDS';

export const QUERY_KEYS: Record<'list', () => QueryKey> = {
  list: () => ['checkInfo'],
};

export function useCheckInfo() {
  const smDS = useSMDS();

  return useQuery({
    queryKey: QUERY_KEYS.list(),
    queryFn: () => smDS.getCheckInfo(),
  });
}
