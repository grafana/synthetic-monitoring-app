import { Probe } from 'types';

import { db } from '../db';

export const PRIVATE_PROBE: Probe = db.probe.build({
  labels: [
    { name: 'Mr', value: 'Orange' },
    { name: 'chimi', value: 'churri' },
  ],
  k6Versions: {
    v0: 'v0.54.1',
    v1: null,
    v2: null,
  },
});

export const PUBLIC_PROBE: Probe = db.probe.build({
  public: true,
  online: false,
  k6Versions: {
    v0: null,
    v1: 'v1.2.3',
    v2: 'v2.0.0',
  },
});

export const ONLINE_PROBE: Probe = db.probe.build({
  k6Versions: {
    v0: null,
    v1: 'v1.5.1',
    v2: 'v2.1.2',
  },
});

export const OFFLINE_PROBE: Probe = db.probe.build({
  online: false,
  k6Versions: {
    v0: 'v0.48.0',
    v1: 'v1.2.3',
    v2: null,
  },
});

export const SCRIPTED_DISABLED_PROBE: Probe = db.probe.build({
  capabilities: {
    disableScriptedChecks: true,
    disableBrowserChecks: true,
  },
  k6Versions: {
    v0: null,
    v1: null,
    v2: 'v2.3.4',
  },
});

export const UNSELECTED_PRIVATE_PROBE: Probe = db.probe.build({
  k6Versions: {
    v0: null,
    v1: null,
    v2: 'v2.3.4',
  },
});

export const DEFAULT_PROBES = [PRIVATE_PROBE, PUBLIC_PROBE, UNSELECTED_PRIVATE_PROBE];

export const ADD_PROBE_TOKEN_RESPONSE = `A very tasty added token`;
export const UPDATED_PROBE_TOKEN_RESPONSE = `A very tasty updated token`;
