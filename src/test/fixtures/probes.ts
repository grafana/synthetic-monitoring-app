import { Probe } from 'types';

import { db } from '../db';

export const PRIVATE_PROBE: Probe = db.probe.build({
  labels: [
    { name: 'Mr', value: 'Orange' },
    { name: 'chimi', value: 'churri' },
  ],
  k6Version: 'v0.54.1',
  supportsBinaryProvisioning: false,
  supportedChannels: ['v1'],
});

export const PUBLIC_PROBE: Probe = db.probe.build({
  public: true,
  online: false,
  supportsBinaryProvisioning: true,
  supportedChannels: ['v1', 'v2', 'fast'],
});

export const ONLINE_PROBE: Probe = db.probe.build({
  supportsBinaryProvisioning: true,
  supportedChannels: ['v1', 'v2'],
});

export const OFFLINE_PROBE: Probe = db.probe.build({
  online: false,
  k6Version: 'v1.2.3',
  supportsBinaryProvisioning: false,
  supportedChannels: ['v1'],
});

export const SCRIPTED_DISABLED_PROBE: Probe = db.probe.build({
  capabilities: {
    disableScriptedChecks: true,
    disableBrowserChecks: true,
  },
  supportsBinaryProvisioning: true,
  supportedChannels: ['v2'],
});

export const UNSELECTED_PRIVATE_PROBE: Probe = db.probe.build({
  k6Version: 'v2.3.4',
  supportsBinaryProvisioning: false,
  supportedChannels: ['v2'],
});

export const DEFAULT_PROBES = [PRIVATE_PROBE, PUBLIC_PROBE, UNSELECTED_PRIVATE_PROBE];

export const ADD_PROBE_TOKEN_RESPONSE = `A very tasty added token`;
export const UPDATED_PROBE_TOKEN_RESPONSE = `A very tasty updated token`;
