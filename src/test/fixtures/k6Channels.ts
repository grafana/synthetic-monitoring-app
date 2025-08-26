import { K6Channel, ListChannelsResponse } from 'types';

export const K6_CHANNELS: Record<string, K6Channel> = {
  v0: {
    name: 'v0',
    default: false,
    deprecatedAfter: '2024-12-31T00:00:00Z', // Already deprecated
    disabledAfter: '2025-12-31T00:00:00Z',
    manifest: 'k6>=0.5,k6<1',
  },
  v1: {
    name: 'v1',
    default: true,
    deprecatedAfter: '2025-12-31T00:00:00Z',
    disabledAfter: '2026-12-31T00:00:00Z',
    manifest: 'k6>=1,k6<2',
  },
  v2: {
    name: 'v2',
    default: false,
    deprecatedAfter: '2026-12-31T00:00:00Z',
    disabledAfter: '2027-12-31T00:00:00Z',
    manifest: 'k6>=2',
  },
};

export const K6_CHANNELS_MOCK_DATA: ListChannelsResponse = {
  channels: K6_CHANNELS,
};
