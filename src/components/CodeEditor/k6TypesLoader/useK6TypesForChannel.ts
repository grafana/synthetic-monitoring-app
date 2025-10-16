import { useEffect } from 'react';
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
    error: typesError,
    isSuccess,
    isError
  } = useQuery({
    queryKey: ['k6-types', version, channelId],
    queryFn: () => fetchK6TypesFromCDN(version!),
    enabled: enabled && Boolean(version) && !hasVersionError,
    throwOnError: false,
  });

  // Simple logging when types are ready
  useEffect(() => {
    if (isSuccess && types && version && channelId) {
      const moduleCount = Object.keys(types).length;
      console.log(`[K6-Types] ✅ Channel "${channelId}" → k6 v${version} (${moduleCount} modules loaded)`);
    }
  }, [isSuccess, types, version, channelId]);

  useEffect(() => {
    if (isError && typesError && version && channelId) {
      console.error(`[K6-Types] ❌ Channel "${channelId}" → k6 v${version} failed:`, typesError);
    }
  }, [isError, typesError, version, channelId]);

  if (hasVersionError) {
    console.warn(`[K6-Types] ⚠️ Failed to resolve version for channel "${channelId}" - will use bundled types as fallback`);
  }

  return {
    types: types || null,
    loading: isVersionLoading || isTypesLoading,
    error: hasVersionError ? 'Failed to get version for channel' : 
           typesError ? (typesError as Error).message : null,
    version: version || null,
  };
}
