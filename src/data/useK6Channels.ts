import { type QueryKey, useQuery } from '@tanstack/react-query';

import { K6ChannelWithCurrent, ListChannelsResponse } from 'types';
import { SMDataSource } from 'datasource/DataSource';
import { useSMDS } from 'hooks/useSMDS';

export const queryKeys: Record<'list' | 'current', (channelId?: string) => QueryKey> = {
  list: () => ['k6-channels'],
  current: (channelId) => ['k6-channel-current', channelId],
};

const channelsQuery = (api: SMDataSource) => ({
  queryKey: queryKeys.list(),
  queryFn: async (): Promise<ListChannelsResponse> => {
    return api.listK6Channels();
  },
  enabled: true,
});

const currentVersionQuery = (api: SMDataSource, channelId: string) => ({
  queryKey: queryKeys.current(channelId),
  queryFn: async (): Promise<string> => {
    return api.getCurrentK6Version(channelId);
  },
  enabled: Boolean(channelId),
});

export function useK6Channels() {
  const smDS = useSMDS();
  
  return useQuery(channelsQuery(smDS));
}

export function useCurrentK6Version(channelId?: string) {
  const smDS = useSMDS();
  
  return useQuery(currentVersionQuery(smDS, channelId || ''));
}
