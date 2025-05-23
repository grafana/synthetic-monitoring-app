import { DataFrameJSON } from '@grafana/data';

import { AlertRecord, Check, CheckAlertPublished, Probe, PrometheusAlertsGroup, Settings, ThresholdSettings } from 'types';
import { AccountingClassNames, DashboardInfo } from 'datasource/types';

export type ListProbeResult = Probe[];

export type AddProbeResult = {
  probe: Probe;
  token: string;
};

export type DeleteProbeSuccess = {
  msg: string;
  probeId: Probe['id'];
};

export type DeleteProbeError = {
  err: string;
  msg: string;
};

export type DeleteProbeResult = DeleteProbeSuccess | DeleteProbeError;

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

export type ListTenantLimitsResponse = {
  MaxBrowserChecks: number;
  MaxChecks: number;
  MaxScriptedChecks: number;
  MaxMetricLabels: number;
  MaxLogLabels: number;
  maxAllowedMetricLabels: number;
  maxAllowedLogLabels: number;
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

export interface InstantMetric {
  metric: Record<string, string>;
  value: [Time, string];
}

export interface RangeMetric {
  metric: {};
  values: Array<[Time, string]>;
}

export interface MetricDatasourceResponse<T> {
  status: string;
  data: {
    result: T[];
    resultType: string;
  };
}

export interface MetricProbeSuccessRate extends InstantMetric {
  metric: {
    probe: string;
  };
}

export interface MetricCheckSuccess extends InstantMetric {
  metric: {
    instance: string;
    job: string;
  };
}

export interface MetricLatency extends InstantMetric {
  metric: {};
}

export type DashboardResponse = DashboardInfo;

export type AlertGroupResponse = {
  name: string;
  rules: AlertRecord[];
};

export type ListDatasourceAlertsResponse = {
  [key: string]: AlertGroupResponse[];
};

export type ListPrometheusAlertsResponse = {
  data: {
    groups: PrometheusAlertsGroup[];
  };
  status: `success`;
};

export type LogsQueryResponse = {
  results: Record<
    string,
    {
      frames: DataFrameJSON[];
    }
  >;
};

export type AccessTokenResponse = {
  msg: string;
  token: string;
};

export type CheckAlertsResponse = {
  alerts: CheckAlertPublished[];
};
