import { IconName } from '@grafana/data';

import { CheckType, CheckTypeGroup } from 'types';

interface TileCopy {
  icon: IconName;
  description: string;
}

// Picker-specific copy: one short, parallel line per option so the choices can be compared at a
// glance. Anything missing here falls back to the option's own description and icon.
export const CHECK_TYPE_TILE_COPY: Partial<Record<CheckType, TileCopy>> = {
  [CheckType.Http]: {
    icon: 'globe',
    description: 'Request a URL and check its status, response time and SSL certificate.',
  },
  [CheckType.Ping]: {
    icon: 'signal',
    description: 'Ping a host to see whether it is reachable and how quickly it responds.',
  },
  [CheckType.Grpc]: {
    icon: 'heart-rate',
    description: 'Call a service’s gRPC health check to confirm it is serving.',
  },
  [CheckType.Dns]: {
    icon: 'sitemap',
    description: 'Resolve a domain and measure how long resolution takes.',
  },
  [CheckType.Tcp]: {
    icon: 'plug',
    description: 'Connect to a host and port and confirm it accepts connections.',
  },
  [CheckType.Traceroute]: {
    icon: 'arrow-random',
    description: 'Trace the network path from each probe to a host.',
  },
};

export const CHECK_TYPE_GROUP_TILE_COPY: Partial<Record<CheckTypeGroup, TileCopy>> = {
  [CheckTypeGroup.MultiStep]: {
    icon: 'multi-step',
    description: 'Chain HTTP requests, passing values from one response to the next.',
  },
  [CheckTypeGroup.Scripted]: {
    icon: 'k6',
    description: 'Write a k6 script to test HTTP, WebSockets or any custom logic.',
  },
  [CheckTypeGroup.Browser]: {
    icon: 'browser-alt',
    description: 'Script a real browser to load pages and interact like a user.',
  },
};
