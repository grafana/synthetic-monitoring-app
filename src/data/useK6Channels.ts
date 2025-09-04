import { type QueryKey, useQuery } from '@tanstack/react-query';

import { FeatureName } from 'types';
import { SMDataSource } from 'datasource/DataSource';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useSMDS } from 'hooks/useSMDS';

export const queryKeys: Record<'list' | 'current', (channelId?: string) => QueryKey> = {
  list: () => ['k6-channels'],
  current: (channelId) => ['k6-channel-current', channelId],
};

const channelsQuery = (api: SMDataSource, enabled: boolean) => ({
  queryKey: queryKeys.list(),
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

const currentVersionQuery = (api: SMDataSource, channelId: string, enabled: boolean) => ({
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

export function useK6Channels(isScriptedOrBrowser: boolean) {
  const smDS = useSMDS();
  const isVersionManagementEnabled = useFeatureFlag(FeatureName.VersionManagement).isEnabled;

  const enabled = isVersionManagementEnabled && isScriptedOrBrowser;
  return useQuery(channelsQuery(smDS, enabled));
}

export function useCurrentK6Version(enabled: boolean, channelId?: string) {
  const smDS = useSMDS();
  return useQuery(currentVersionQuery(smDS, channelId || '', enabled));
}
