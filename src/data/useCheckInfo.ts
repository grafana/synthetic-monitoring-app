import { useContext } from 'react';
import { type QueryKey, useQuery } from '@tanstack/react-query';

import { SMDataSource } from 'datasource/DataSource';
import { InstanceContext } from 'contexts/InstanceContext';

export const queryKeys: Record<'list', () => QueryKey> = {
  list: () => ['checkInfo'],
};

export function useCheckInfo() {
  const { instance } = useContext(InstanceContext);
  const api = instance.api as SMDataSource;

  return useQuery({
    queryKey: queryKeys.list(),
    queryFn: () => api.getCheckInfo(),
  });
}
