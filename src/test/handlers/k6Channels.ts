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
      v0: '0.25.1',  // Much older version, before execution module
      v1: '1.2.0',
    };
    
    const version = versionMap[channelId];
    
    if (!version) {
      // Return 404 for unknown channels (more realistic)
      return {
        status: 404,
        json: { error: `Channel ${channelId} not found` },
      };
    }
    
    return {
      json: { version },
    };
  },
};
