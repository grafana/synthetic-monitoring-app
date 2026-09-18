import { type QueryKey, useInfiniteQuery, useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { isFetchError } from '@grafana/runtime';

import { type MutationProps } from 'data/types';
import { FaroEvent } from 'faro';
import type { TokenInfo } from 'datasource/responses.types';
import { useSMDS } from 'hooks/useSMDS';

export const QUERY_KEYS: Record<'list', QueryKey> = {
  list: ['tokens'],
};

export function useTokens(pageSize = 50, enabled = true) {
  const smDS = useSMDS();

  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.list, pageSize],
    initialPageParam: ``,
    queryFn: ({ pageParam }) => smDS.listTokens(pageSize, pageParam || undefined),
    getNextPageParam: (lastPage) => lastPage.next_cursor || undefined,
    enabled,
  });
}

export function useCreateToken({ onError, onSuccess }: MutationProps<string> = {}) {
  const smDS = useSMDS();
  const qc = useQueryClient();

  return useMutation<string, Error, void, UseMutationResult>({
    mutationFn: () => smDS.createApiToken(),
    onError: (error) => {
      onError?.(error);
    },
    onSuccess: (token) => {
      // Refetching already-loaded pages would reuse their original cursors,
      // which duplicates or skips rows once a mutation shifts the page
      // boundaries, so restart from the first page instead.
      qc.resetQueries({ queryKey: QUERY_KEYS.list });
      onSuccess?.(token);
    },
    meta: {
      event: {
        type: FaroEvent.CreateAccessToken,
      },
      errorAlert: () => `Failed to create access token`,
    },
  });
}

export function useDeleteToken({ onError, onSuccess }: MutationProps<void> = {}) {
  const smDS = useSMDS();
  const qc = useQueryClient();

  return useMutation<void, Error, TokenInfo['id'], UseMutationResult>({
    mutationFn: async (id: TokenInfo['id']) => {
      try {
        return await smDS.deleteToken(id);
      } catch (error) {
        if (isFetchError(error)) {
          throw new Error(error.data?.msg ?? 'Failed to delete access token');
        }

        throw error;
      }
    },
    onError: (error) => {
      onError?.(error);
    },
    onSuccess: () => {
      // See useCreateToken: reset instead of refetching stale cursor pages.
      qc.resetQueries({ queryKey: QUERY_KEYS.list });
      onSuccess?.();
    },
    meta: {
      event: {
        type: FaroEvent.DeleteAccessToken,
      },
      successAlert: () => `Access token revoked`,
      errorAlert: (error: Error) => error.message,
    },
  });
}
