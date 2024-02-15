import { Label, Probe } from 'types';

export const PRIVATE_PROBE = {
  name: 'tacos',
  id: 1,
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
} as const satisfies Probe;

export const PUBLIC_PROBE = {
  name: 'burritos',
  id: 2,
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
} as const satisfies Probe;

export const ONLINE_PROBE = {
  ...PRIVATE_PROBE,
  online: true,
} as const satisfies Probe;

export const OFFLINE_PROBE = {
  ...PRIVATE_PROBE,
  online: false,
} as const satisfies Probe;

export const UNSELECTED_PRIVATE_PROBE = {
  name: 'enchiladas',
  id: 3,
  public: false,
  latitude: 19.70519,
  longitude: -101.18815,
  region: 'APAC',
  labels: [{ name: 'Mr', value: 'Yellow' }] as Label[],
  online: false,
  onlineChange: 1700005000.0,
  version: 'v1',
  deprecated: false,
  modified: 1700000000.0,
  created: 1694212496.731247,
} as const satisfies Probe;

export const DEFAULT_PROBES = [PRIVATE_PROBE, PUBLIC_PROBE, UNSELECTED_PRIVATE_PROBE];
