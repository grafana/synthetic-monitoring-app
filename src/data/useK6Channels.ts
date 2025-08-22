import { type QueryKey, useQuery } from '@tanstack/react-query';

import { ListChannelsResponse } from 'types';
import { SMDataSource } from 'datasource/DataSource';
import { useSMDS } from 'hooks/useSMDS';

export const queryKeys: Record<'list' | 'current', (channelId?: string) => QueryKey> = {
  list: () => ['k6-channels'],
  current: (channelId) => ['k6-channel-current', channelId],
};

const channelsQuery = (api: SMDataSource, enabled = true) => ({
  queryKey: queryKeys.list(),
  queryFn: async (): Promise<ListChannelsResponse> => {
    return api.listK6Channels();
  },
  enabled,
});

const currentVersionQuery = (api: SMDataSource, channelId: string, enabled = true) => ({
  queryKey: queryKeys.current(channelId),
  queryFn: async (): Promise<string> => {
    return api.getCurrentK6Version(channelId);
  },
  enabled: Boolean(channelId) && enabled,
});

export function useK6Channels(enabled = true) {
  const smDS = useSMDS();
  
  return useQuery(channelsQuery(smDS, enabled));
}

export function useCurrentK6Version(channelId?: string, enabled = true) {
  const smDS = useSMDS();
  
  return useQuery(currentVersionQuery(smDS, channelId || '', enabled));
}
