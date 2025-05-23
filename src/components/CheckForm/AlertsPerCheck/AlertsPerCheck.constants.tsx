import { CheckAlertCategory, CheckAlertType, CheckType, ThresholdUnit } from 'types';

export interface PredefinedAlertInterface {
  type: CheckAlertType;
  name: string;
  description: string;
  unit: ThresholdUnit;
  category: CheckAlertCategory;
  query: string;
  defaultValues: {
    threshold: number;
    period?: (typeof ALERT_PERIODS)[number]['value'];
    isSelected: boolean;
  };
  supportsPeriod: boolean;
}

export const ALERT_PERIODS = [
  { label: '5 min', value: '5m' },
  { label: '10 min', value: '10m' },
  { label: '15 min', value: '15m' },
  { label: '20 min', value: '20m' },
  { label: '30 min', value: '30m' },
  { label: '1 h', value: '1h' },
] as const;

const TLS_TARGET_CERTIFICATE_CLOSE_TO_EXPIRING_ALERT: PredefinedAlertInterface = {
  type: CheckAlertType.TLSTargetCertificateCloseToExpiring,
  name: 'HTTP Target Certificate Close To Expiring',
  description: 'Trigger an alert if the target certificate will expire in less than $threshold days.',
  supportsPeriod: false,
  unit: 'd',
  category: CheckAlertCategory.TLSCertificate,
  defaultValues: {
    threshold: 1,
    isSelected: false,
  },
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
};

export const GLOBAL_PREDEFINED_ALERTS: PredefinedAlertInterface[] = [
  {
    type: CheckAlertType.ProbeFailedExecutionsTooHigh,
    name: 'Probe Failed Executions Too High',
    description: `The available periods are shown based on the selected check frequency. Only periods equal to or greater than the check frequency will be available for selection.`,
    supportsPeriod: true,
    unit: 'no.',
    category: CheckAlertCategory.FailedChecks,
    defaultValues: {
      threshold: 1,
      period: '5m',
      isSelected: false,
    },
    query: `
    (
      sum by(instance, job) (
        floor(
          increase(probe_all_success_count{instance="$instance", job="$job"}[$period]) - 
          increase(probe_all_success_sum{instance="$instance", job="$job"}[$period])
        )
      ) >= 
     $threshold
    ) * on (instance, job) 
    group_right() 
    max without(probe, region, geohash) (
      sm_check_info{instance="$instance", job="$job"}
    )
  `,
  },
];

export const HTTP_PREDEFINED_ALERTS: PredefinedAlertInterface[] = [TLS_TARGET_CERTIFICATE_CLOSE_TO_EXPIRING_ALERT];
export const TCP_PREDEFINED_ALERTS: PredefinedAlertInterface[] = [TLS_TARGET_CERTIFICATE_CLOSE_TO_EXPIRING_ALERT];

export const PREDEFINED_ALERTS: Record<CheckType, PredefinedAlertInterface[]> = Object.fromEntries(
  Object.values(CheckType).map((checkType) => [
    checkType,
    [
      ...GLOBAL_PREDEFINED_ALERTS,
      ...(checkType === CheckType.HTTP ? HTTP_PREDEFINED_ALERTS : []),
      ...(checkType === CheckType.TCP ? TCP_PREDEFINED_ALERTS : []),
    ],
  ])
) as Record<CheckType, PredefinedAlertInterface[]>;

export const ALL_PREDEFINED_ALERTS: PredefinedAlertInterface[] = [
  ...GLOBAL_PREDEFINED_ALERTS,
  ...HTTP_PREDEFINED_ALERTS,
  ...TCP_PREDEFINED_ALERTS,
];
