import { Probe } from 'types';

import { DB } from '../db';

export const PRIVATE_PROBE: Probe = DB.probe.build({
  labels: [
    { name: 'Mr', value: 'Orange' },
    { name: 'chimi', value: 'churri' },
  ],
  k6Versions: {
    v1: 'v1.2.3',
    v2: null, // Does not support v2
  },
});

export const PUBLIC_PROBE: Probe = DB.probe.build({
  public: true,
  online: false,
  k6Versions: {
    v1: 'v1.5.5',
    v2: 'v2.0.1',
  },
});

export const ONLINE_PROBE: Probe = DB.probe.build({});

export const OFFLINE_PROBE: Probe = DB.probe.build({
  online: false,
});

export const SCRIPTED_DISABLED_PROBE: Probe = DB.probe.build({
  capabilities: {
    disableScriptedChecks: true,
    disableBrowserChecks: true,
  },
});

export const UNSELECTED_PRIVATE_PROBE: Probe = DB.probe.build({});

export const DEFAULT_PROBES = [PRIVATE_PROBE, PUBLIC_PROBE, UNSELECTED_PRIVATE_PROBE];

export const ADD_PROBE_TOKEN_RESPONSE = `A very tasty added token`;
export const UPDATED_PROBE_TOKEN_RESPONSE = `A very tasty updated token`;
