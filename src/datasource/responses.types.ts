import { Probe } from 'types';

export type ListProbeResult = Probe[];

export type AddProbeResult = {
  probe: Probe;
  token: string;
};

export type DeleteProbeResult = {
  msg: string;
  probeId: Probe['id'];
};

export type UpdateProbeResult = {
  probe: Probe;
};

export type ResetProbeTokenResult = {
  probe: Probe;
  token: string;
};
