import { useMemo } from 'react';
import { type QueryKey, useQuery } from '@tanstack/react-query';

import { Check, FeatureName, K6Channel } from 'types';
import { isBrowserCheck, isScriptedCheck } from 'utils.types';
import { SMDataSource } from 'datasource/DataSource';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useSMDS } from 'hooks/useSMDS';

export const queryKeys: Record<'list', () => QueryKey> = {
  list: () => ['k6-channels'],
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

export function useK6Channels(isScriptedOrBrowser: boolean) {
  const smDS = useSMDS();
  const isVersionManagementEnabled = useFeatureFlag(FeatureName.VersionManagement).isEnabled;

  const enabled = isVersionManagementEnabled && isScriptedOrBrowser;
  return useQuery(channelsQuery(smDS, enabled));
}

// Filter channels based on deprecation status
export function getFilteredChannels(
  channels: K6Channel[],
  isExistingCheck: boolean,
  previousChannelId?: string | null
): K6Channel[] {
  if (!channels.length) {
    return [];
  }

  return channels.filter((channel) => {
    const isDeprecated = new Date(channel.deprecatedAfter) < new Date();

    // Skip deprecated channels for new checks
    if (isDeprecated && !isExistingCheck) {
      return false;
    }

    // Skip deprecated channels for existing checks unless it was previously assigned
    if (isDeprecated && isExistingCheck && channel.id !== previousChannelId) {
      return false;
    }

    return true;
  });
}


export function useFilteredK6Channels(isScriptedOrBrowser: boolean, check?: Check) {
  const { data: channelsResponse, ...queryResult } = useK6Channels(isScriptedOrBrowser);
  
  const { filteredChannels, defaultChannelId } = useMemo(() => {
    const originalChannels = channelsResponse?.channels || [];
    const isExistingCheck = !!check;
    
    // Get the previous channel ID for existing checks
    const previousChannelId = isExistingCheck && check
      ? (() => {
          if (isScriptedCheck(check) && check.settings && 'scripted' in check.settings) {
            return check.settings.scripted.channel || null;
          }
          if (isBrowserCheck(check) && check.settings && 'browser' in check.settings) {
            return check.settings.browser.channel || null;
          }
          return null;
        })()
      : null;
    
    const filteredChannels = getFilteredChannels(originalChannels, isExistingCheck, previousChannelId);
    
    // Find the default channel from filtered channels
    const defaultChannel = filteredChannels.find((channel) => channel.default) || filteredChannels[0];
    const defaultChannelId = defaultChannel?.id || '';
    
    return { filteredChannels, defaultChannelId };
  }, [channelsResponse?.channels, check]);

  return {
    ...queryResult,
    data: channelsResponse ? { ...channelsResponse, channels: filteredChannels } : undefined,
    channels: filteredChannels,
    defaultChannelId,
  };
}
