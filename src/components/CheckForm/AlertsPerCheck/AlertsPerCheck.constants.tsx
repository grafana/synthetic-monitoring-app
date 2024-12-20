import { CheckAlertType, CheckType, ThresholdUnit } from 'types';

export interface PredefinedAlertInterface {
  type: CheckAlertType;
  description: string;
  unit: ThresholdUnit;
}

const GLOBAL_PREDEFINED_ALERTS: PredefinedAlertInterface[] = [
  {
    type: CheckAlertType.ProbeFailedExecutionsTooHigh,
    unit: '%',
    description:
      'Alert when the percentage of failed probe executions during the time that the alert rule evaluates is higher than the threshold',
  },
];

const HTTP_PREDEFINED_ALERTS: PredefinedAlertInterface[] = [
  {
    type: CheckAlertType.HTTPRequestDurationTooHighP50,
    unit: 'ms',
    description: 'Alert when the 50th percentile of the HTTP request duration is higher than the threshold',
  },
  {
    type: CheckAlertType.HTTPRequestDurationTooHighP90,
    unit: 'ms',
    description: 'Alert when the 90th percentile of the HTTP request duration is higher than the threshold',
  },
  {
    type: CheckAlertType.HTTPRequestDurationTooHighP95,
    unit: 'ms',
    description: 'Alert when the 95th percentile of the HTTP request duration is higher than the threshold',
  },
  {
    type: CheckAlertType.HTTPRequestDurationTooHighP99,
    unit: 'ms',
    description: 'Alert when the 99th percentile of the HTTP request duration is higher than the threshold',
  },
  {
    type: CheckAlertType.HTTPTargetCertificateCloseToExpiring,
    unit: 'd',
    description: 'Alert when the target certificate is close to expiring',
  },
];

const PING_PREDEFINED_ALERTS: PredefinedAlertInterface[] = [
  {
    type: CheckAlertType.PingICMPDurationTooHighP50,
    unit: 'ms',
    description: 'Alert when the 50th percentile of the ICMP ping duration is higher than the threshold',
  },
  {
    type: CheckAlertType.PingICMPDurationTooHighP90,
    unit: 'ms',
    description: 'Alert when the 90th percentile of the ICMP ping duration is higher than the threshold',
  },
  {
    type: CheckAlertType.PingICMPDurationTooHighP95,
    unit: 'ms',
    description: 'Alert when the 95th percentile of the ICMP ping duration is higher than the threshold',
  },
  {
    type: CheckAlertType.PingICMPDurationTooHighP99,
    unit: 'ms',
    description: 'Alert when the 99th percentile of the ICMP ping duration is higher than the threshold',
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
