import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { DataFrameJSON, TimeRange } from '@grafana/data';

import { useSyntheticMonitoringDS } from './useSyntheticMonitoringDS';

type Args = {
  expr: string;
  range: TimeRange;
};

export function useLogs() {
  const smDS = useSyntheticMonitoringDS();

  return useMutation<DataFrameJSON[], Error, Args, UseMutationResult>({
    mutationFn: async ({ expr, range }: Args) => {
      try {
        const res = await smDS.queryLogs(expr, range);
        return res;
      } catch (error) {
        throw error;
      }
    },
  });
}
