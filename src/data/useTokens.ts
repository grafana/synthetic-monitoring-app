import { type QueryKey, useMutation, UseMutationResult, useQuery } from '@tanstack/react-query';

import { type MutationProps } from 'data/types';
import { FaroEvent } from 'faro';
import { queryClient } from 'data/queryClient';
import { useSMDS } from 'hooks/useSMDS';
import type { ListTokensResponse, TokenInfo } from 'datasource/responses.types';

export const QUERY_KEYS: Record<'list', QueryKey> = {
  list: ['tokens'],
};

export function useTokens(limit = 50, offset = 0) {
  const smDS = useSMDS();

  return useQuery<ListTokensResponse>({
    queryKey: [...QUERY_KEYS.list, limit, offset],
    queryFn: () => smDS.listTokens(limit, offset),
  });
}

export function useCreateToken({ eventInfo, onError, onSuccess }: MutationProps<string> = {}) {
  const smDS = useSMDS();

  return useMutation<string, Error, void, UseMutationResult>({
    mutationFn: () => smDS.createApiToken(),
    onError: (error) => {
      onError?.(error);
    },
    onSuccess: (token) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
      onSuccess?.(token);
    },
    meta: {
      event: {
        info: eventInfo,
        type: FaroEvent.CreateAccessToken,
      },
      successAlert: () => `Access token created`,
      errorAlert: () => `Failed to create access token`,
    },
  });
}

export function useDeleteToken({ eventInfo, onError, onSuccess }: MutationProps<void> = {}) {
  const smDS = useSMDS();

  return useMutation<void, Error, TokenInfo['id'], UseMutationResult>({
    mutationFn: (id: number) => smDS.deleteToken(id),
    onError: (error) => {
      onError?.(error);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
      onSuccess?.();
    },
    meta: {
      event: {
        info: eventInfo,
        type: FaroEvent.DeleteAccessToken,
      },
      successAlert: () => `Access token deleted`,
      errorAlert: () => `Failed to delete access token`,
    },
  });
}
