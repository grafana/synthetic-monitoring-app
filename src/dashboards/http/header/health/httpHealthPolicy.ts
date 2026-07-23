import type { BaselineSummary } from 'dashboards/components/CheckDashboardHeader/health/baseline';

import type { HealthState } from 'dashboards/components/CheckDashboardHeader/health/checkHealth.types';

export interface HealthDecision {
  state: HealthState;
  summary: string;
}

function isUsableValue(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}

export function evaluateRatioGuardrail(value: number | null): HealthDecision {
  if (!isUsableValue(value)) {
    return { state: 'unknown', summary: 'No completed executions' };
  }

  if (value < 0.99) {
    return { state: 'unhealthy', summary: 'Below 99%' };
  }

  if (value < 0.995) {
    return { state: 'degraded', summary: 'Below 99.5%' };
  }

  return { state: 'healthy', summary: 'At least 99.5%' };
}

export function evaluateLatencyGuardrail(value: number | null): HealthDecision {
  if (!isUsableValue(value)) {
    return { state: 'unknown', summary: 'No latency samples' };
  }

  if (value >= 2) {
    return { state: 'unhealthy', summary: 'Average latency is at least 2 seconds' };
  }

  if (value >= 1) {
    return { state: 'degraded', summary: 'Average latency is at least 1 second' };
  }

  return { state: 'healthy', summary: 'Average latency is under 1 second' };
}

export function evaluateSslGuardrail(value: number | null): HealthDecision {
  if (!isUsableValue(value)) {
    return { state: 'unknown', summary: 'Certificate expiry unavailable' };
  }

  if (value < 7 * 86_400) {
    return { state: 'unhealthy', summary: 'Certificate expires in under 7 days' };
  }

  if (value < 28 * 86_400) {
    return { state: 'degraded', summary: 'Certificate expires in under 28 days' };
  }

  return { state: 'healthy', summary: 'Certificate has at least 28 days remaining' };
}

export function compareRatioToBaseline(value: number, baseline: Pick<BaselineSummary, 'median' | 'mad'>): HealthDecision {
  if (!Number.isFinite(value)) {
    return { state: 'unknown', summary: 'Selected-range value unavailable' };
  }

  const degradedDelta = Math.max(3 * baseline.mad, 0.005);
  const unhealthyDelta = Math.max(6 * baseline.mad, 0.01);

  if (value <= baseline.median - unhealthyDelta) {
    return { state: 'unhealthy', summary: 'Well below normal' };
  }

  if (value <= baseline.median - degradedDelta) {
    return { state: 'degraded', summary: 'Below normal' };
  }

  return { state: 'healthy', summary: 'Within normal range' };
}

export function compareLatencyToBaseline(
  value: number,
  baseline: Pick<BaselineSummary, 'median' | 'mad'>
): HealthDecision {
  if (!Number.isFinite(value)) {
    return { state: 'unknown', summary: 'Selected-range value unavailable' };
  }

  const degradedDelta = Math.max(3 * baseline.mad, baseline.median * 0.25, 0.05);
  const unhealthyDelta = Math.max(6 * baseline.mad, baseline.median, 0.25);

  if (value >= baseline.median + unhealthyDelta) {
    return { state: 'unhealthy', summary: 'Well above normal' };
  }

  if (value >= baseline.median + degradedDelta) {
    return { state: 'degraded', summary: 'Above normal' };
  }

  return { state: 'healthy', summary: 'Within normal range' };
}
