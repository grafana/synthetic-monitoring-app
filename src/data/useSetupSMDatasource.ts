import { QueryKey } from '@tanstack/query-core';
import { useQuery } from '@tanstack/react-query';
import { getDataSourceSrv } from '@grafana/runtime';

import { SMDataSource } from 'datasource/DataSource';

export const queryKeys: Record<'list', QueryKey> = {
  list: ['get-sm-datasource'],
};

export function useSetupSMDatasource() {
  return useQuery({
    queryKey: queryKeys.list,
    queryFn: () => getDataSourceSrv().get(`Synthetic Monitoring`) as Promise<SMDataSource>,
  });
}
