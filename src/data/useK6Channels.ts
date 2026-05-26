import { useMemo } from 'react';
import { type QueryKey, useQuery } from '@tanstack/react-query';

import { FeatureName } from 'types';
import { SMDataSource } from 'datasource/DataSource';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useSMDS } from 'hooks/useSMDS';

export const QUERY_KEYS: Record<'list', () => QueryKey> = {
  list: () => ['k6-channels'],
};

const channelsQuery = (api: SMDataSource, enabled: boolean) => ({
  queryKey: QUERY_KEYS.list(),
  queryFn: async () => {
    try {
      return await api.listK6Channels();
    } catch (e) {
      throw new Error('Failed to load K6 version channels. Please try again later.');
    }
  },
  enabled,
  throwOnError: false,
});

export function useK6Channels(isScriptedOrBrowser: boolean) {
  const smDS = useSMDS();
  const isVersionManagementEnabled = useFeatureFlag(FeatureName.VersionManagement).isEnabled;

  const enabled = isVersionManagementEnabled && isScriptedOrBrowser;
  return useQuery(channelsQuery(smDS, enabled));
}

export function useFilteredK6Channels(isScriptedOrBrowser: boolean) {
  const { data: channelsResponse, ...queryResult } = useK6Channels(isScriptedOrBrowser);

  const { channels, defaultChannelId } = useMemo(() => {
    const channels = channelsResponse?.channels || [];
    const defaultChannel = channels.find((channel) => channel.default) || channels[0];

    return { channels, defaultChannelId: defaultChannel?.id || '' };
  }, [channelsResponse?.channels]);

  return {
    ...queryResult,
    data: channelsResponse,
    channels,
    defaultChannelId,
  };
}
