import { db } from 'test/db';

import { Probe } from 'types';

export const PRIVATE_PROBE: Probe = db.probe.build({
  labels: [
    { name: 'Mr', value: 'Orange' },
    { name: 'chimi', value: 'churri' },
  ],
});

export const PUBLIC_PROBE: Probe = db.probe.build({
  public: true,
  online: false,
});

export const ONLINE_PROBE: Probe = db.probe.build({});

export const OFFLINE_PROBE: Probe = db.probe.build({
  online: false,
});

export const SCRIPTED_DISABLED_PROBE: Probe = db.probe.build({
  capabilities: {
    disableScriptedChecks: true,
    disableBrowserChecks: true,
  },
});

export const UNSELECTED_PRIVATE_PROBE: Probe = db.probe.build({});

export const DEFAULT_PROBES = [PRIVATE_PROBE, PUBLIC_PROBE, UNSELECTED_PRIVATE_PROBE];

export const ADD_PROBE_TOKEN_RESPONSE = `A very tasty added token`;
export const UPDATED_PROBE_TOKEN_RESPONSE = `A very tasty updated token`;
