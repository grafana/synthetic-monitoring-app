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

export type ListTenantCostAttributionLabelsResponse = {
  names: string[];
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

// Insights API types

export interface InsightsCheckMeta {
  target: string;
  job: string;
  type: string;
  frequency_ms: number;
  enabled: boolean;
}

export interface CheckStatusBreakdown {
  enabled: number;
  disabled: number;
}

export interface CheckProbeInfo {
  check_id: number;
  probe_count: number;
}

export interface ProbeDistribution {
  checks_with_few_probes: CheckProbeInfo[];
  histogram: Record<number, number>;
}

export interface AlertingGaps {
  count: number;
  check_ids: number[] | null;
}

export interface UsageEntry {
  current: number;
  max: number;
}

export interface LimitUsage {
  total_checks: UsageEntry;
  scripted_checks: UsageEntry;
  browser_checks: UsageEntry;
}

export interface LabelCount {
  name: string;
  count: number;
}

export interface UsageInsights {
  checks_by_type: Record<string, number>;
  checks_by_status: CheckStatusBreakdown;
  probe_distribution: ProbeDistribution;
  alerting_gaps: AlertingGaps;
  limit_usage: LimitUsage;
  label_distribution: LabelCount[];
}

export interface FlappingCheck {
  check_id: number;
  state_changes: number;
}

export interface RegionalAnomaly {
  check_id: number;
  anomalous_probes: string[];
  total_probes: number;
  mean_success_rate: number;
}

export interface LatencyDegradation {
  check_id: number;
  previous_p95_ms: number;
  current_p95_ms: number;
  degradation_pct: number;
}

export interface UptimeWarning {
  check_id: number;
  success_rate: number;
}

export interface PerformanceInsights {
  flapping_checks: FlappingCheck[] | null;
  regional_anomalies: RegionalAnomaly[] | null;
  latency_degradation: LatencyDegradation[] | null;
  uptime_warnings: UptimeWarning[] | null;
}

export interface DuplicateGroup {
  target: string;
  type: string;
  check_ids: number[];
}

export interface OverlappingTarget {
  target: string;
  check_types: string[];
  check_ids: number[];
}

export interface LowValueCheck {
  check_id: number;
  success_rate: number;
  frequency_ms: number;
  reason: string;
}

export interface RecommendationInsights {
  duplicate_checks: DuplicateGroup[] | null;
  overlapping_targets: OverlappingTarget[] | null;
  low_value_checks: LowValueCheck[] | null;
}

export interface InsightsResponse {
  checks: Record<string, InsightsCheckMeta>;
  usage: UsageInsights;
  performance: PerformanceInsights | null;
  recommendations: RecommendationInsights;
}
