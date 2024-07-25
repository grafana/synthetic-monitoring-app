import { type QueryKey, useQuery } from '@tanstack/react-query';

import { useSMDS } from 'hooks/useSMDS';

export const queryKeys: Record<'list', () => QueryKey> = {
  list: () => ['checkInfo'],
};

export function useCheckInfo() {
  const smDS = useSMDS();

  return useQuery({
    queryKey: queryKeys.list(),
    queryFn: () => smDS.getCheckInfo(),
  });
}
