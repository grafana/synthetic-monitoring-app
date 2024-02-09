import { Check, Probe, Settings, ThresholdSettings } from 'types';

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

export type ListCheckResult = Check[];

export type AddCheckResult = Check;

export type DeleteCheckResult = {
  msg: string;
  checkId: Check['id'];
};

export type UpdateCheckResult = Check;

export type BulkUpdateCheckResult = {
  msg: string;
};

export type AdHocCheckResponse = {
  id: string;
  tenantId: number;
  timeout: number;
  settings: Settings;
  probes: number[];
  target: string;
};

export type ResetProbeTokenResult = {
  probe: Probe;
  token: string;
};

export type ListTenantSettingsResult = {
  remote_validation_disabled: boolean;
  thresholds: ThresholdSettings;
};

export type UpdateTenantSettingsResult = {
  err?: string;
  msg: string;
};

export type Time = number;

export interface Metric {
  metric: {};
  value: [Time, string];
}

export interface MetricProbeSuccessRate extends Metric {
  metric: {
    probe: string;
  };
}

export interface MetricCheckSuccess extends Metric {
  metric: {
    instance: string;
    job: string;
  };
}

export interface MetricLatency extends Metric {
  metric: {};
}
