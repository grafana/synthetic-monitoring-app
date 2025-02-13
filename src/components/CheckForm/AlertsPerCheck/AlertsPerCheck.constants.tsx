import { CheckAlertCategory, CheckAlertType, CheckType, ThresholdUnit } from 'types';

export interface PredefinedAlertInterface {
  type: CheckAlertType;
  name: string;
  description: string;
  unit: ThresholdUnit;
  category: CheckAlertCategory;
  query: string;
  default?: number;
}
export const GLOBAL_PREDEFINED_ALERTS: PredefinedAlertInterface[] = [
  {
    type: CheckAlertType.ProbeFailedExecutionsTooHigh,
    name: 'Probe Failed Executions Too High',
    description: '',
    unit: '%',
    category: CheckAlertCategory.FailedChecks,
    default: 10,
    query: `
    (
      (1 - (
        sum by (instance, job) (
          increase(probe_all_success_sum{instance="$instance", job="$job"}[5m])
        ) 
        / 
        sum by (instance, job) (
          increase(probe_all_success_count{instance="$instance", job="$job"}[5m])
        )
      )) * 100 
    > 
    $threshold
    ) * on (instance, job) 
    group_right() 
    max without(probe, region, geohash) (sm_check_info{instance="$instance", job="$job"})
  `,
  },
];

export const HTTP_PREDEFINED_ALERTS: PredefinedAlertInterface[] = [
  {
    type: CheckAlertType.HTTPRequestDurationTooHighP50,
    name: 'HTTP Request Duration Too High (P50)',
    description: 'Trigger an alert if the p50 for the HTTP request is higher than $thresholdms for the last 5 minutes',
    unit: 'ms',
    category: CheckAlertCategory.RequestDuration,
    default: 300,
    query: `
  (
    quantile by(instance, job) (
      0.5, 
      sum without(phase)(probe_http_duration_seconds{instance="$instance", job="$job"})
    ) * 1000
  > 
  $threshold
  ) * on (instance, job) 
  group_right() 
  max without(probe, region, geohash) (
    sm_check_info{instance="$instance", job="$job"}
  )
`,
  },
  {
    type: CheckAlertType.HTTPRequestDurationTooHighP90,
    name: 'HTTP Request Duration Too High (P90)',
    description: 'Trigger an alert if the p90 for the HTTP request is higher than $thresholdms for the last 5 minutes',
    unit: 'ms',
    category: CheckAlertCategory.RequestDuration,
    default: 500,
    query: `
  (quantile by(instance, job) (
    0.90, 
    sum without(phase)(probe_http_duration_seconds{instance="$instance", job="$job"})
  ) * 1000 
  > 
  $threshold) 
  * on (instance, job) 
  group_right() 
  max without(probe, region, geohash)(
    sm_check_info{instance="$instance", job="$job"}
  )
`,
  },
  {
    type: CheckAlertType.HTTPRequestDurationTooHighP95,
    name: 'HTTP Request Duration Too High (P95)',
    description: 'Trigger an alert if the p95 for the HTTP request is higher than $thresholdms for the last 5 minutes',
    unit: 'ms',
    category: CheckAlertCategory.RequestDuration,
    default: 800,
    query: `
  (quantile by(instance, job) (
    0.95, 
    sum without(phase)(probe_http_duration_seconds{instance="$instance", job="$job"})
  ) * 1000 
  > 
  $threshold) 
  * on (instance, job) 
  group_right() 
  max without(probe, region, geohash)(
    sm_check_info{instance="$instance", job="$job"}
  )
`,
  },
  {
    type: CheckAlertType.HTTPRequestDurationTooHighP99,
    name: 'HTTP Request Duration Too High (P99)',
    description: 'Trigger an alert if the p99 for the HTTP request is higher than $thresholdms for the last 5 minutes',
    unit: 'ms',
    category: CheckAlertCategory.RequestDuration,
    default: 1500,
    query: `
  (quantile by(instance, job) (
    0.99, 
    sum without(phase)(probe_http_duration_seconds{instance="$instance", job="$job"})
  ) * 1000 
  > 
  $threshold) 
  * on (instance, job) 
  group_right() 
  max without(probe, region, geohash)(
    sm_check_info{instance="$instance", job="$job"}
  )
`,
  },
  {
    type: CheckAlertType.HTTPTargetCertificateCloseToExpiring,
    name: 'HTTP Target Certificate Close To Expiring',
    description: 'Trigger an alert if the target certificate will expire in less than $threshold days',
    unit: 'd',
    category: CheckAlertCategory.SystemHealth,
    default: 60,
    query: `
  (
    (min by(instance, job) (probe_ssl_earliest_cert_expiry{instance="$instance", job="$job"}) - time()) 
    / (60 * 60 * 24) 
    < 
    $threshold
  ) 
  * on (instance, job) 
  group_right() 
  max without(probe, region, geohash) (
    sm_check_info{instance="$instance", job="$job"}
  )
`,
  },
];

export const PING_PREDEFINED_ALERTS: PredefinedAlertInterface[] = [
  {
    type: CheckAlertType.PingICMPDurationTooHighP50,
    name: 'Ping ICMP Duration Too High (P50)',
    description: 'Trigger an alert if the p50 for the ICMP request is higher than $thresholdms for the last 5 minutes',
    unit: 'ms',
    category: CheckAlertCategory.RequestDuration,
    default: 50,
    query: `
  (quantile by(instance, job) (
    0.5, 
    sum without(phase)(probe_icmp_duration_seconds{instance="$instance", job="$job"})
  ) * 1000 
  > 
  $threshold) 
  * on (instance, job) 
  group_right() 
  max without(probe, region, geohash)(
    sm_check_info{instance="$instance", job="$job"}
  )
`,
  },
  {
    type: CheckAlertType.PingICMPDurationTooHighP90,
    name: 'Ping ICMP Duration Too High (P90)',
    description: 'Trigger an alert if the p90 for the ICMP request is higher than $thresholdms for the last 5 minutes',
    unit: 'ms',
    category: CheckAlertCategory.RequestDuration,
    default: 100,
    query: `
  (quantile by(instance, job) (
    0.90, 
    sum without(phase)(probe_icmp_duration_seconds{instance="$instance", job="$job"})
  ) * 1000 
  > 
 $threshold) 
  * on (instance, job) 
  group_right() 
  max without(probe, region, geohash)(
    sm_check_info{instance="$instance", job="$job"}
  )
`,
  },
  {
    type: CheckAlertType.PingICMPDurationTooHighP95,
    name: 'Ping ICMP Duration Too High (P95)',
    description: 'Trigger an alert if the p95 for the ICMP request is higher than $thresholdms for the last 5 minutes',
    unit: 'ms',
    category: CheckAlertCategory.RequestDuration,
    default: 200,
    query: `
  (quantile by(instance, job) (
    0.95, 
    sum without(phase)(probe_icmp_duration_seconds{instance="$instance", job="$job"})
  ) * 1000 
  > 
  $threshold) 
  * on (instance, job) 
  group_right() 
  max without(probe, region, geohash)(
    sm_check_info{instance="$instance", job="$job"}
  )
`,
  },
  {
    type: CheckAlertType.PingICMPDurationTooHighP99,
    name: 'Ping ICMP Duration Too High (P99)',
    description: 'Trigger an alert if the p99 for the ICMP request is higher than $thresholdms for the last 5 minutes',
    unit: 'ms',
    category: CheckAlertCategory.RequestDuration,
    default: 400,
    query: `
  (quantile by(instance, job) (
    0.99, 
    sum without(phase)(probe_icmp_duration_seconds{instance="$instance", job="$job"})
  ) * 1000 
  > 
  $threshold) 
  * on (instance, job) 
  group_right() 
  max without(probe, region, geohash)(
    sm_check_info{instance="$instance", job="$job"}
  )
`,
  },
];

export const PREDEFINED_ALERTS: Record<CheckType, PredefinedAlertInterface[]> = Object.fromEntries(
  Object.values(CheckType).map((checkType) => [
    checkType,
    [
      ...GLOBAL_PREDEFINED_ALERTS,
      ...(checkType === CheckType.HTTP ? HTTP_PREDEFINED_ALERTS : []),
      ...(checkType === CheckType.PING ? PING_PREDEFINED_ALERTS : []),
    ],
  ])
) as Record<CheckType, PredefinedAlertInterface[]>;

export const ALL_PREDEFINED_ALERTS: PredefinedAlertInterface[] = [
  ...GLOBAL_PREDEFINED_ALERTS,
  ...HTTP_PREDEFINED_ALERTS,
  ...PING_PREDEFINED_ALERTS,
];
