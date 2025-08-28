import { type QueryKey, useQuery } from '@tanstack/react-query';

import { SMDataSource } from 'datasource/DataSource';
import { useSMDS } from 'hooks/useSMDS';

export const queryKeys: Record<'list' | 'current', (channelId?: string) => QueryKey> = {
  list: () => ['k6-channels'],
  current: (channelId) => ['k6-channel-current', channelId],
};

const channelsQuery = (api: SMDataSource, enabled = true) => ({
  queryKey: queryKeys.list(),
  queryFn: async () => {
    try {
      return await api.listK6Channels();
    } catch (e) {
      throw new Error('Failed to load K6 version channels. Please try again later.');
    }
  },
  enabled,
  throwOnError: true,
});

const currentVersionQuery = (api: SMDataSource, channelId: string, enabled = true) => ({
  queryKey: queryKeys.current(channelId),
  queryFn: async () => {
    try {
      return await api.getCurrentK6Version(channelId);
    } catch (e) {
      throw new Error('Failed to fetch the current K6 version for the selected channel. Please try again later.');
    }
  },
  enabled: Boolean(channelId) && enabled,
  throwOnError: true,
});

export function useK6Channels(enabled = true) {
  const smDS = useSMDS();
  return useQuery(channelsQuery(smDS, enabled));
}

export function useCurrentK6Version(channelId?: string, enabled = true) {
  const smDS = useSMDS();
  return useQuery(currentVersionQuery(smDS, channelId || '', enabled));
}
