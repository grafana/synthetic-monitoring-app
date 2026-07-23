import { QueryKey } from '@tanstack/query-core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSMDS } from 'hooks/useSMDS';

export const QUERY_KEYS: Record<'labelMode', QueryKey> = {
  labelMode: ['labelMode'],
};

export function useLabelMode() {
  const smDS = useSMDS();

  return useQuery({
    queryKey: QUERY_KEYS.labelMode,
    queryFn: () => smDS.getLabelMode(),
  });
}

export function useSetLabelMode() {
  const smDS = useSMDS();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mode: number) => smDS.setLabelMode(mode),
    onSuccess: (data) => {
      // The PUT response carries the new state, so the cache can be updated
      // without a refetch.
      queryClient.setQueryData(QUERY_KEYS.labelMode, data);
    },
  });
}
