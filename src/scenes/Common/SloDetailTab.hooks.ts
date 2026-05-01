import { useQuery } from '@tanstack/react-query';
import { useTimeRange } from '@grafana/scenes-react';

import type { Slo } from './useSmCheckSlos.types';
import { InstantMetric } from 'datasource/responses.types';
import { queryInstantMetric } from 'data/utils';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { STANDARD_REFRESH_INTERVAL } from 'components/constants';

interface SloMetricResult extends InstantMetric {
  metric: Record<string, string>;
}

export interface SloMetrics {
  sli: number | null;
  remainingErrorBudget: number | null;
  burnRate: number | null;
  isLoading: boolean;
  isError: boolean;
}

function getSloLabelMatcher(uuid: string): string {
  return `grafana_slo_uuid="${uuid}"`;
}

function getInterval(fromEpoch: number, toEpoch: number): string {
  const durationSeconds = toEpoch - fromEpoch;

  if (durationSeconds <= 3600) {
    return '1m';
  }
  if (durationSeconds <= 21600) {
    return '5m';
  }
  if (durationSeconds <= 86400) {
    return '15m';
  }
  return '1h';
}

export function buildSliQuery(uuid: string, window: string): string {
  const matcher = getSloLabelMatcher(uuid);
  return `clamp_max(
sum(sum_over_time((grafana_slo_success_rate_5m{${matcher}} < +Inf)[${window}:5m]))
/ sum(sum_over_time((grafana_slo_total_rate_5m{${matcher}} < +Inf)[${window}:5m])), 1)`;
}

export function buildErrorBudgetQuery(uuid: string, window: string): string {
  const matcher = getSloLabelMatcher(uuid);
  return `(
  clamp_max(sum(sum_over_time((grafana_slo_success_rate_5m{${matcher}} < +Inf)[${window}:5m]))
  / sum(sum_over_time((grafana_slo_total_rate_5m{${matcher}} < +Inf)[${window}:5m])), 1)
  - on() grafana_slo_objective{${matcher}}
)
/ on () (1 - grafana_slo_objective{${matcher}})`;
}

export function buildBurnRateQuery(uuid: string, interval: string): string {
  const matcher = getSloLabelMatcher(uuid);
  return `avg without(__grafana_origin) (1 - clamp_max(avg_over_time((grafana_slo_sli_5m{${matcher}} < +Inf)[${interval}:]), 1))
/ on(grafana_slo_uuid) group_left() (1 - (grafana_slo_objective{${matcher}} < +Inf))`;
}

function extractValue(results: SloMetricResult[]): number | null {
  if (!results.length) {
    return null;
  }
  const val = Number(results[0].value[1]);
  if (!Number.isFinite(val)) {
    return null;
  }
  return val;
}

const QUERY_KEY_PREFIX = ['slo-metrics'] as const;

export function useSloMetrics(slo: Slo): SloMetrics {
  const metricsDS = useMetricsDS();
  const url = metricsDS?.url ?? '';
  const [timeRange] = useTimeRange();

  const fromEpoch = Math.floor(timeRange.from.valueOf() / 1000);
  const toEpoch = Math.floor(timeRange.to.valueOf() / 1000);
  const interval = getInterval(fromEpoch, toEpoch);

  const uuid = slo.uuid;
  const window = slo.objectives[0]?.window ?? '28d';
  const enabled = Boolean(metricsDS) && Boolean(uuid);

  const sliQuery = useQuery({
    queryKey: [...QUERY_KEY_PREFIX, 'sli', uuid, window, url, fromEpoch, toEpoch],
    queryFn: () =>
      queryInstantMetric<SloMetricResult>({
        url,
        query: buildSliQuery(uuid, window),
        start: fromEpoch,
        end: toEpoch,
      }),
    refetchInterval: STANDARD_REFRESH_INTERVAL,
    enabled,
    select: extractValue,
  });

  const errorBudgetQuery = useQuery({
    queryKey: [...QUERY_KEY_PREFIX, 'error-budget', uuid, window, url, fromEpoch, toEpoch],
    queryFn: () =>
      queryInstantMetric<SloMetricResult>({
        url,
        query: buildErrorBudgetQuery(uuid, window),
        start: fromEpoch,
        end: toEpoch,
      }),
    refetchInterval: STANDARD_REFRESH_INTERVAL,
    enabled,
    select: extractValue,
  });

  const burnRateQuery = useQuery({
    queryKey: [...QUERY_KEY_PREFIX, 'burn-rate', uuid, interval, url, fromEpoch, toEpoch],
    queryFn: () =>
      queryInstantMetric<SloMetricResult>({
        url,
        query: buildBurnRateQuery(uuid, interval),
        start: fromEpoch,
        end: toEpoch,
      }),
    refetchInterval: STANDARD_REFRESH_INTERVAL,
    enabled,
    select: extractValue,
  });

  return {
    sli: sliQuery.data ?? null,
    remainingErrorBudget: errorBudgetQuery.data ?? null,
    burnRate: burnRateQuery.data ?? null,
    isLoading: sliQuery.isLoading || errorBudgetQuery.isLoading || burnRateQuery.isLoading,
    isError: sliQuery.isError || errorBudgetQuery.isError || burnRateQuery.isError,
  };
}
