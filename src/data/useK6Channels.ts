import { useMemo } from 'react';
import { type QueryKey, useQuery } from '@tanstack/react-query';

import { FeatureName } from 'types';
import { SMDataSource } from 'datasource/DataSource';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useSMDS } from 'hooks/useSMDS';

interface UseFilteredK6ChannelsOptions {
  isExistingCheck: boolean;
  previousChannelId?: string | null;
}

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

export function useFilteredK6Channels(isScriptedOrBrowser: boolean, options: UseFilteredK6ChannelsOptions) {
  const { data: channelsResponse, ...queryResult } = useK6Channels(isScriptedOrBrowser);
  const { isExistingCheck, previousChannelId } = options;

  const filteredChannels = useMemo(() => {
    if (!channelsResponse?.channels) {
      return [];
    }

    return channelsResponse.channels.filter((channel) => {
      const isDeprecated = new Date(channel.deprecatedAfter) < new Date();
      const isDisabled = new Date(channel.disabledAfter) < new Date();

      // Skip deprecated channels for new checks
      if (isDeprecated && !isExistingCheck) {
        return false;
      }

      // Skip deprecated channels for existing checks unless it was previously assigned
      if (isDeprecated && isExistingCheck && channel.id !== previousChannelId) {
        return false;
      }

      // Skip disabled channels for new checks
      if (isDisabled && !isExistingCheck) {
        return false;
      }

      // Skip disabled channels for existing checks unless it was previously assigned
      if (isDisabled && isExistingCheck && channel.id !== previousChannelId) {
        return false;
      }

      return true;
    });
  }, [channelsResponse?.channels, isExistingCheck, previousChannelId]);

  const defaultChannelId = useMemo(() => {
    if (!channelsResponse?.channels) {
      return '';
    }
    
    // Find the default channel from original channels
    const originalDefault = channelsResponse.channels.find((channel) => channel.default);
    
    // Check if the default channel is available in filtered channels
    const isDefaultAvailable = originalDefault && filteredChannels.some((channel) => channel.id === originalDefault.id);
    
    // Return the original default if available, otherwise the first available channel
    return isDefaultAvailable ? originalDefault.id : (filteredChannels[0]?.id || '');
  }, [channelsResponse?.channels, filteredChannels]);

  return {
    ...queryResult,
    data: channelsResponse ? { ...channelsResponse, channels: filteredChannels } : undefined,
    channels: filteredChannels,
    defaultChannelId,
  };
}
