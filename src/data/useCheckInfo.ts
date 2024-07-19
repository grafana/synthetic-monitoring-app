import { type QueryKey, useQuery } from '@tanstack/react-query';

import { useSyntheticMonitoringDS } from './useSyntheticMonitoringDS';

export const queryKeys: Record<'list', () => QueryKey> = {
  list: () => ['checkInfo'],
};

export function useCheckInfo() {
  const smDS = useSyntheticMonitoringDS();

  return useQuery({
    queryKey: queryKeys.list(),
    queryFn: () => smDS.getCheckInfo(),
  });
}
