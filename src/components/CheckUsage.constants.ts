import { IconName } from '@grafana/ui';

import { CheckType } from 'types';

export const HIDE_TELEMETRY_FOR_TYPES = [CheckType.Scripted, CheckType.MultiHttp, CheckType.Browser];

export type UsageRowKey = 'executions' | 'series' | 'dpm' | 'logs';

export interface UsageRowDefinition {
  key: UsageRowKey;
  icon: IconName;
  label: string;
  unit?: string;
  description: string;
}

export const TEST_VOLUME_ROWS: UsageRowDefinition[] = [
  {
    key: 'executions',
    icon: 'calendar-alt',
    label: 'Test executions per month',
    description: "Estimated from this check's frequency and the probes you have selected, across a 30-day month.",
  },
];

export const BILLED_TELEMETRY_ROWS: UsageRowDefinition[] = [
  {
    key: 'series',
    icon: 'chart-line',
    label: 'Active series',
    description: 'Metric series this check publishes, counted per probe.',
  },
  {
    key: 'dpm',
    icon: 'clock-nine',
    label: 'Data points per minute',
    description:
      'Samples written every minute across all selected probes. Frequency and probe count drive this figure.',
  },
  {
    key: 'logs',
    icon: 'database',
    label: 'Log usage per month',
    unit: 'GB',
    description: 'Estimated volume of probe result logs written over a 30-day month.',
  },
];
