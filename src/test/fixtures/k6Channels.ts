import { K6Channel, ListChannelsResponse } from 'types';

export const K6_CHANNELS: K6Channel[] = [
  {
    id: 'v0',
    name: 'v0',
    default: false,
    deprecatedAfter: '2023-12-31T00:00:00Z', // Already deprecated
    manifest: 'k6>=0.5,k6<1',
  },
  {
    id: 'v1',
    name: 'v1',
    default: true,
    deprecatedAfter: '2026-01-01T00:00:00Z',
    manifest: 'k6>=1,k6<2',
  },
  {
    id: 'v2',
    name: 'v2',
    default: false,
    deprecatedAfter: '2028-12-31T00:00:00Z',
    manifest: 'k6>=2',
  },
];

export const K6_CHANNELS_MOCK_DATA: ListChannelsResponse = {
  channels: K6_CHANNELS,
};
