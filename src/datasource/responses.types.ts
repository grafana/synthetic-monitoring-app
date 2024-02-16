import { Check, Probe, Settings, ThresholdSettings } from 'types';
import { AccountingClassNames, DashboardInfo } from 'datasource/types';

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

export type ResetProbeTokenResult = UpdateProbeResult & {
  token: string;
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

interface AccountingClass {
  CheckClass: number;
  CheckType: number;
  Series: number;
}

type CheckAccountingClasses = {
  [key in AccountingClassNames]: AccountingClass;
};

export type CheckInfoResult = {
  AccountingClasses: CheckAccountingClasses;
};

type Remote = {
  name: string;
  password: string;
  url: string;
  username: string;
};

export type TenantResponse = {
  created: Time;
  eventsRemote: Remote;
  id: number;
  limits: null;
  metricsRemote: Remote;
  modified: Time;
  orgId: number;
  reason: string;
  stackId: number;
  status: number;
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

export interface MetricDatasourceResponse<T> {
  status: string;
  data: {
    result: T[];
    resultType: string;
  };
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

export type DashboardResponse = DashboardInfo;
