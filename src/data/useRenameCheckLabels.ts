import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS as CHECK_QUERY_KEYS } from 'data/useChecks';
import { useSMDS } from 'hooks/useSMDS';

export function useRenameCheckLabels() {
  const smDS = useSMDS();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) => smDS.renameCheckLabels(from, to),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHECK_QUERY_KEYS.list });
    },
  });
}
