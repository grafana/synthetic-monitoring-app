import { CheckAlertType } from 'types';
import type { AppTimeRangeMode } from 'contexts/AppTimeProvider.utils';

export type HealthState = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export type HealthEvidenceKind = 'alert' | 'slo' | 'baseline' | 'guardrail';
export type HealthEvidenceScope = 'evaluation' | 'range';

export interface HealthRange {
  from: number;
  to: number;
}

export interface HealthEvidence {
  id: string;
  kind: HealthEvidenceKind;
  scope: HealthEvidenceScope;
  state: HealthState;
  metricId?: string;
  summary: string;
  detail?: string;
  range: HealthRange;
  explanationPriority: number;
  metadata?: Record<string, unknown>;
}

export interface HealthEvidenceProviderResult {
  sourceId: string;
  evidence: HealthEvidence[];
  isLoading: boolean;
  error?: Error;
}

export type MetricAlertState =
  | 'unsupported'
  | 'not-configured'
  | 'configured'
  | 'historical'
  | 'firing'
  | 'pending'
  | 'error';

export interface MetricAlertModel {
  state: MetricAlertState;
  alertType?: CheckAlertType;
  message?: string;
  canWrite?: boolean;
  /** Count of firing episodes overlapping the selected range. */
  fireCount?: number;
}

export interface MetricHealthModel {
  state: HealthState;
  rangeState: HealthState;
  evidence: HealthEvidence[];
  hasPartialEvidence: boolean;
  alert: MetricAlertModel;
  trend?: MetricTrendModel;
}

export interface CheckHealthModel {
  state: HealthState;
  rangeState: HealthState;
  rangeMode: AppTimeRangeMode;
  evaluationAt: number;
  metrics: Record<string, MetricHealthModel>;
  evidence: HealthEvidence[];
  compactReasons: HealthEvidence[];
  rangeReasons: HealthEvidence[];
  qualifiers: string[];
  hasPartialEvidence: boolean;
  liveIncidentCount: number;
}

export type MetricTrendShape =
  | 'stable'
  | 'rising'
  | 'falling'
  | 'variable'
  | 'returned'
  | 'shifted'
  | 'insufficient';

export interface MetricTrendModel {
  shape: MetricTrendShape;
  label: string;
  source: HealthEvidenceKind | 'none';
}

export const HEALTH_EXPLANATION_PRIORITY = {
  alert: 400,
  slo: 300,
  guardrail: 200,
  baseline: 100,
} as const satisfies Record<HealthEvidenceKind, number>;
