import { db } from 'test/db';

import { Label, Probe } from 'types';

export const PRIVATE_PROBE: Probe = db.probe.build({
  id: 1,
  name: 'tacos',
  public: false,
  labels: [
    { name: 'Mr', value: 'Orange' },
    { name: 'chimi', value: 'churri' },
  ] as Label[],
  capabilities: {
    disableScriptedChecks: false,
    disableBrowserChecks: false,
  },
  online: true,
});

export const PUBLIC_PROBE: Probe = db.probe.build({
  name: 'burrito',
  id: 2,
  public: true,
  labels: [{ name: 'Mr', value: 'Pink' }] as Label[],
  online: false,
});

export const ONLINE_PROBE: Probe = db.probe.build({
  name: 'enchilada',
  id: 3,
  public: false,
  online: true,
});

export const OFFLINE_PROBE: Probe = db.probe.build({
  name: 'quesadilla',
  id: 4,
  public: false,
  online: false,
});

export const SCRIPTED_DISABLED_PROBE: Probe = db.probe.build({
  name: 'empanada',
  id: 5,
  public: false,
  capabilities: {
    disableScriptedChecks: true,
    disableBrowserChecks: true,
  },
});

export const UNSELECTED_PRIVATE_PROBE: Probe = db.probe.build({
  name: 'tostada',
  id: 6,
  public: false,
});

export const DEFAULT_PROBES = [PRIVATE_PROBE, PUBLIC_PROBE, UNSELECTED_PRIVATE_PROBE];

export const ADD_PROBE_TOKEN_RESPONSE = `A very tasty added token`;
export const UPDATED_PROBE_TOKEN_RESPONSE = `A very tasty updated token`;
