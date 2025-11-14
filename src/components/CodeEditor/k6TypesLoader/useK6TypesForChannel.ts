import { useQuery } from '@tanstack/react-query';

import { fetchK6TypesFromCDN } from './k6TypesCdnLoader';

interface UseK6TypesForChannelResult {
  types: Record<string, string> | null;
  loading: boolean;
  error: string | null;
  version: string | null;
}

export function useK6TypesForChannel(channelId?: string, enabled = true): UseK6TypesForChannelResult {
  const {
    data: types,
    isLoading: isTypesLoading,
    error,
  } = useQuery({
    queryKey: ['k6-types', channelId],
    queryFn: () => fetchK6TypesFromCDN(channelId!),
    enabled: enabled && Boolean(channelId),
    throwOnError: false,
  });

  return {
    types: types || null,
    loading: isTypesLoading,
    error: error ? (error as Error).message : null,
    version: channelId ?? null,
  };
}
