import { useContext } from 'react';
import { QueryKey } from '@tanstack/query-core';
import { useQuery } from '@tanstack/react-query';

import { SMDataSource } from 'datasource/DataSource';
import { InstanceContext } from 'contexts/InstanceContext';

export const queryKeys: Record<'list', QueryKey> = {
  list: ['tenantLimits'],
};

export function useTenantLimits() {
  const { instance } = useContext(InstanceContext);
  const api = instance.api as SMDataSource;

  return useQuery({
    queryKey: queryKeys.list,
    queryFn: () => api.getTenantLimits(),
  });
}
