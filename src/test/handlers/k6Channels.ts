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
