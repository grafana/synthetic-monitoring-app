import { useContext } from 'react';
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { DataFrameJSON, TimeRange } from '@grafana/data';

import { SMDataSource } from 'datasource/DataSource';
import { InstanceContext } from 'contexts/InstanceContext';

type Args = {
  expr: string;
  range: TimeRange;
};

export function useLogs() {
  const { instance } = useContext(InstanceContext);
  const api = instance.api as SMDataSource;

  return useMutation<DataFrameJSON[], Error, Args, UseMutationResult>({
    mutationFn: async ({ expr, range }: Args) => {
      try {
        const res = await api.queryLogs(expr, range);
        return res;
      } catch (error) {
        throw error;
      }
    },
  });
}
