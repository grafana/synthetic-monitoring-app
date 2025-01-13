import { CheckAlertCategory, CheckAlertType, CheckType, ThresholdUnit } from 'types';

export interface PredefinedAlertInterface {
  type: CheckAlertType;
  name: string;
  unit: ThresholdUnit;
  category: CheckAlertCategory;
}

const GLOBAL_PREDEFINED_ALERTS: PredefinedAlertInterface[] = [
  {
    type: CheckAlertType.ProbeFailedExecutionsTooHigh,
    name: 'Probe Failed Executions Too High',
    unit: '%',
    category: CheckAlertCategory.SystemHealth,
  },
];

const HTTP_PREDEFINED_ALERTS: PredefinedAlertInterface[] = [
  {
    type: CheckAlertType.HTTPRequestDurationTooHighP50,
    name: 'HTTP Request Duration Too High (P50)',
    unit: 'ms',
    category: CheckAlertCategory.RequestDuration,
  },
  {
    type: CheckAlertType.HTTPRequestDurationTooHighP90,
    name: 'HTTP Request Duration Too High (P90)',
    unit: 'ms',
    category: CheckAlertCategory.RequestDuration,
  },
  {
    type: CheckAlertType.HTTPRequestDurationTooHighP95,
    name: 'HTTP Request Duration Too High (P95)',
    unit: 'ms',
    category: CheckAlertCategory.RequestDuration,
  },
  {
    type: CheckAlertType.HTTPRequestDurationTooHighP99,
    name: 'HTTP Request Duration Too High (P99)',
    unit: 'ms',
    category: CheckAlertCategory.RequestDuration,
  },
  {
    type: CheckAlertType.HTTPTargetCertificateCloseToExpiring,
    name: 'HTTP Target Certificate Close To Expiring',
    unit: 'd',
    category: CheckAlertCategory.SystemHealth,
  },
];

const PING_PREDEFINED_ALERTS: PredefinedAlertInterface[] = [
  {
    type: CheckAlertType.PingICMPDurationTooHighP50,
    name: 'Ping ICMP Duration Too High (P50)',
    unit: 'ms',
    category: CheckAlertCategory.RequestDuration,
  },
  {
    type: CheckAlertType.PingICMPDurationTooHighP90,
    name: 'Ping ICMP Duration Too High (P90)',
    unit: 'ms',
    category: CheckAlertCategory.RequestDuration,
  },
  {
    type: CheckAlertType.PingICMPDurationTooHighP95,
    name: 'Ping ICMP Duration Too High (P95)',
    unit: 'ms',
    category: CheckAlertCategory.RequestDuration,
  },
  {
    type: CheckAlertType.PingICMPDurationTooHighP99,
    name: 'Ping ICMP Duration Too High (P99)',
    unit: 'ms',
    category: CheckAlertCategory.RequestDuration,
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
