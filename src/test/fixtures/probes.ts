import { Label, Probe } from 'types';

export const PRIVATE_PROBE: Probe = {
  name: 'tacos',
  id: 32,
  public: false,
  latitude: 51.49375,
  longitude: -0.12679,
  region: 'EMEA',
  labels: [
    { name: 'Mr', value: 'Orange' },
    { name: 'chimi', value: 'churri' },
  ] as Label[],
  online: true,
  onlineChange: 1700005000.0,
  version: 'unknown',
  deprecated: false,
  modified: 1700000000.0,
  created: 1694212496.731247,
} as const;

export const PUBLIC_PROBE: Probe = {
  name: 'burritos',
  id: 42,
  public: true,
  latitude: 19.70519,
  longitude: -101.18815,
  region: 'AMER',
  labels: [{ name: 'Mr', value: 'Pink' }] as Label[],
  online: false,
  onlineChange: 1700005000.0,
  version: 'v0.3.6-3-g39b5f5a',
  deprecated: false,
  modified: 1700000000.0,
  created: 1694212496.731247,
} as const;

export const ONLINE_PROBE: Probe = {
  ...PRIVATE_PROBE,
  online: true,
} as const;

export const OFFLINE_PROBE: Probe = {
  ...PRIVATE_PROBE,
  online: false,
} as const;

export const DEFAULT_PROBES = [PRIVATE_PROBE, PUBLIC_PROBE];
