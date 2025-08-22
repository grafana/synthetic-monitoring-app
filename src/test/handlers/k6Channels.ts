import { K6_CHANNELS_MOCK_DATA } from 'test/fixtures/k6Channels';

import { ApiEntry } from 'test/handlers/types';
import { ListChannelsResponse } from 'types';

export const listK6Channels: ApiEntry<ListChannelsResponse> = {
  route: `/sm/channels/k6`,
  method: `get`,
  result: () => {
    return {
      json: K6_CHANNELS_MOCK_DATA,
    };
  },
};

export const getCurrentK6Version: ApiEntry<{ version: string }> = {
  route: `/sm/channel/k6/\\w+/current`,
  method: `get`,
  result: (req) => {

    const url = req.url.pathname;
    const match = url.match(/\/sm\/channel\/k6\/(\w+)\/current/);
    const channelId = match ? match[1] : '';
    
    // Mock version resolution based on channel
    const versionMap: Record<string, string> = {
      v0: 'v0.54.1',
      v1: 'v1.9.2', 
      v2: 'v2.0.1',
    };
    
    const version = versionMap[channelId] || 'v1.9.2'; // Default fallback
    
    return {
      json: { version },
    };
  },
};
