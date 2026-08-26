import { QueryKey } from '@tanstack/query-core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { LabelMode } from 'datasource/responses.types';
import { QUERY_KEYS as TENANT_QUERY_KEYS } from 'data/useTenant';
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
    mutationFn: (mode: LabelMode) => smDS.setLabelMode(mode),
    onSuccess: async (data) => {
      // The PUT response carries the new state, so the cache can be updated
      // without a refetch.
      queryClient.setQueryData(QUERY_KEYS.labelMode, data);
      // A transition bumps tenant.modified server-side (used for the migration
      // cooldown), so the cached tenant must be refreshed rather than left
      // stale. Awaited so the mutation stays pending (busy) until the refetch
      // lands — otherwise Finalize is briefly clickable before the cooldown
      // engages.
      await queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.tenant });
    },
  });
}
