import { db } from 'test/db';

import { Label, Probe } from 'types';

export const PRIVATE_PROBE: Probe = db.probe.create({
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

export const PUBLIC_PROBE = db.probe.create({
  name: 'burrito',
  id: 2,
  public: true,
  labels: [{ name: 'Mr', value: 'Pink' }] as Label[],
  online: false,
});

export const ONLINE_PROBE = db.probe.create({
  name: 'enchilada',
  id: 3,
  public: false,
  online: true,
});

export const OFFLINE_PROBE = db.probe.create({
  name: 'quesadilla',
  id: 4,
  public: false,
  online: false,
});

export const SCRIPTED_DISABLED_PROBE = db.probe.create({
  name: 'empanada',
  id: 5,
  public: false,
  capabilities: {
    disableScriptedChecks: true,
    disableBrowserChecks: true,
  },
});

export const UNSELECTED_PRIVATE_PROBE = db.probe.create({
  name: 'tostada',
  id: 6,
  public: false,
});

export const DEFAULT_PROBES = [PRIVATE_PROBE, PUBLIC_PROBE, UNSELECTED_PRIVATE_PROBE];

export const ADD_PROBE_TOKEN_RESPONSE = `A very tasty added token`;
export const UPDATED_PROBE_TOKEN_RESPONSE = `A very tasty updated token`;
