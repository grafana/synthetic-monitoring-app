import { formatDateFromNow } from 'dashboards/components/CheckDashboardHeader/headerMetricValue';
import type { BaselineSummary } from 'dashboards/components/CheckDashboardHeader/health/baseline';

import type {
  HealthEvidenceKind,
  HealthState,
  MetricTrendModel,
  MetricTrendShape,
} from 'dashboards/components/CheckDashboardHeader/health/checkHealth.types';
import type { AppTimeRangeMode } from 'contexts/AppTimeProvider.utils';

export type HttpTrendMetricId = 'uptime' | 'reachability' | 'average-latency' | 'ssl-expiry';

export interface HttpTrendInterpretationInput {
  metricId: HttpTrendMetricId;
  shape: MetricTrendShape;
  evaluationState: HealthState;
  rangeState: HealthState;
  source: HealthEvidenceKind | 'none';
  rangeMode: AppTimeRangeMode;
  movement?: 'rising' | 'falling';
  rangeValue?: number | null;
  alertAtEvaluation?: boolean;
  alertResolvedInRange?: boolean;
  stabilised?: boolean;
}

function stateWord(state: HealthState): string {
  switch (state) {
    case 'unhealthy':
      return 'critical';
    case 'degraded':
      return 'degraded';
    case 'healthy':
      return 'healthy';
    case 'unknown':
      return 'unknown';
  }
}

function isMovementTowardHealth(metricId: HttpTrendMetricId, shape: MetricTrendShape): boolean {
  if (metricId === 'average-latency') {
    return shape === 'falling';
  }

  return shape === 'rising';
}

function directionalDescription(metricId: HttpTrendMetricId, shape: MetricTrendShape): string {
  const direction = shape === 'rising' ? 'increased' : 'decreased';

  switch (metricId) {
    case 'average-latency':
      return `Latency ${direction} across this range`;
    case 'reachability':
      return `Reachability ${direction} across this range`;
    case 'uptime':
      return `Uptime ${direction} across this range`;
    case 'ssl-expiry':
      return `Certificate lifetime ${direction} across this range`;
  }
}

function withSslExpiryDate(label: string, rangeValue: number | null | undefined): string {
  const date = formatDateFromNow(rangeValue ?? null);

  return date ? `${label} · expires ${date}` : label;
}

function interpretSslTrend(input: HttpTrendInterpretationInput): string {
  if (input.shape === 'rising') {
    return 'Renewed during this range';
  }

  if (input.shape === 'returned') {
    return 'Certificate changed during this range';
  }

  const remaining = input.rangeValue;

  if (typeof remaining === 'number' && remaining < 0) {
    const date = formatDateFromNow(remaining);

    return date ? `Expired on ${date}` : 'Expired';
  }

  if (input.evaluationState === 'unhealthy') {
    return withSslExpiryDate('Renewal overdue', remaining);
  }

  if (input.evaluationState === 'degraded') {
    return withSslExpiryDate('Approaching expiry threshold', remaining);
  }

  return withSslExpiryDate('On track for renewal', remaining);
}

export function interpretHttpMetricTrend(input: HttpTrendInterpretationInput): MetricTrendModel {
  const { metricId, shape, source } = input;
  let label: string;

  if (shape === 'insufficient') {
    label = 'Trend not established';
  } else if (shape === 'variable') {
    label = 'Variable across this range';
  } else if (metricId === 'ssl-expiry') {
    label = interpretSslTrend(input);
  } else if (
    metricId === 'reachability' &&
    input.rangeValue === 0 &&
    input.rangeState === 'unhealthy'
  ) {
    label = 'Unavailable throughout this range';
  } else if (input.alertAtEvaluation) {
    const health = stateWord(input.evaluationState);

    if (shape === 'returned') {
      label = `Recovering but still ${health}`;
    } else if (isMovementTowardHealth(metricId, shape)) {
      label =
        input.rangeMode === 'live'
          ? `Improving but still ${health}`
          : `Improving, but still ${health} when the range ended`;
    } else if (shape === 'rising' || shape === 'falling') {
      label =
        input.rangeMode === 'live'
          ? `${health.charAt(0).toUpperCase()}${health.slice(1)} and worsening`
          : `Worsening, and still ${health} when the range ended`;
    } else {
      label = `Persistently ${health}`;
    }
  } else if (
    shape === 'returned' &&
    source === 'alert' &&
    input.alertResolvedInRange &&
    input.stabilised
  ) {
    label =
      input.rangeMode === 'live'
        ? 'Recovered earlier in this range'
        : 'Recovered before the range ended';
  } else if (shape === 'returned' && source === 'alert' && input.alertResolvedInRange) {
    label = `Recovering but still ${stateWord(input.evaluationState)}`;
  } else if (shape === 'returned' && source === 'baseline' && input.stabilised) {
    label =
      input.rangeMode === 'live'
        ? 'Returned to its normal range'
        : 'Returned to its normal range before the range ended';
  } else if (shape === 'returned' && source === 'slo' && input.stabilised) {
    label = 'Returned within its SLO';
  } else if (shape === 'returned' && source === 'guardrail' && input.stabilised) {
    label = 'Back within the expected range';
  } else if (shape === 'rising' || shape === 'falling') {
    if (source === 'none') {
      label = directionalDescription(metricId, shape);
    } else {
      label = isMovementTowardHealth(metricId, shape) ? 'Generally improving' : 'Generally worsening';
    }
  } else if (shape === 'shifted') {
    label = input.movement === 'falling' ? 'Shifted lower recently' : 'Shifted higher recently';
  } else if (metricId === 'reachability' && input.rangeState === 'healthy') {
    label = 'Consistently reachable';
  } else if (metricId === 'uptime' && input.rangeState === 'healthy') {
    label = 'Consistently available';
  } else if (input.rangeState === 'unhealthy' && source === 'baseline') {
    label = 'Persistently outside its normal range';
  } else if (input.rangeState === 'unhealthy') {
    label = 'Persistently outside the expected range';
  } else {
    label = 'Stable across this range';
  }

  return { shape, label, source };
}

export function getHttpTrendMaterialDelta(
  metricId: HttpTrendMetricId,
  baseline?: Pick<BaselineSummary, 'median' | 'mad'>
): number {
  switch (metricId) {
    case 'uptime':
    case 'reachability':
      return Math.max((baseline?.mad ?? 0) * 3, 0.005);
    case 'average-latency':
      return Math.max((baseline?.mad ?? 0) * 3, (baseline?.median ?? 0) * 0.1, 0.05);
    case 'ssl-expiry':
      return 86_400;
  }
}
