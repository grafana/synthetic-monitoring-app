import { useQuery } from '@tanstack/react-query';

import { useCurrentK6Version } from 'data/useK6Channels';

import { fetchK6TypesFromCDN } from './k6TypesCdnLoader';

interface UseK6TypesForChannelResult {
  types: Record<string, string> | null;
  loading: boolean;
  error: string | null;
  version: string | null;
}

export function useK6TypesForChannel(channelId?: string, enabled = true): UseK6TypesForChannelResult {
  const { 
    data: version, 
    isLoading: isVersionLoading, 
    isError: hasVersionError 
  } = useCurrentK6Version(enabled && Boolean(channelId), channelId);

  const { 
    data: types, 
    isLoading: isTypesLoading, 
    error: typesError
  } = useQuery({
    queryKey: ['k6-types', version, channelId],
    queryFn: () => fetchK6TypesFromCDN(version!),
    enabled: enabled && Boolean(version) && !hasVersionError,
    throwOnError: false,
  });


  return {
    types: types || null,
    loading: isVersionLoading || isTypesLoading,
    error: hasVersionError ? 'Failed to get version for channel' : 
           typesError ? (typesError as Error).message : null,
    version: version || null,
  };
}
