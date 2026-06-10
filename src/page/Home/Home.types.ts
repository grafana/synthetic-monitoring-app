import { Check, ThresholdValues } from 'types';

export enum CheckHealthStatus {
  Down = 0,
  Firing = 1,
  Degraded = 2,
  NoData = 3,
  Healthy = 4,
}

export interface CheckHealth {
  check: Check;
  status: CheckHealthStatus;
  /** Success ratio (0-1) over the current state window, null when no recent data */
  recentSuccessRate: number | null;
  /** Success ratio (0-1) over the reachability window, null when no data */
  reachability: number | null;
  firingCount: number;
  firingAlertNames: Set<string>;
}

export interface HomeKpis {
  totalChecks: number;
  disabledChecks: number;
  downCount: number;
  firingAlertsCount: number;
  degradedCount: number;
  noDataCount: number;
  healthyCount: number;
}

export interface ComputeCheckHealthOptions {
  checks: Check[];
  currentSuccessRates?: Array<{ metric: { instance: string; job: string }; value: [number, number | string] }>;
  reachabilityRates?: Array<{ metric: { instance: string; job: string }; value: [number, number | string] }>;
  alertStates?: Record<string, { firingCount: number; firingAlertNames: Set<string> }>;
  reachabilityThreshold?: ThresholdValues;
}
