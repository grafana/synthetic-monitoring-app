import React, { PropsWithChildren } from 'react';
import { PanelData } from '@grafana/data';
import { ALERT_EPISODE_END_TOLERANCE_MS } from 'dashboards/annotations/alertAnnotation.constants';
import {
  getAlertEpisodeStateAt,
  NamedAlertEpisode,
} from 'dashboards/annotations/annotationEvents';
import { useDashboardAlertEpisodes } from 'dashboards/annotations/DashboardAnnotationsProvider';
import { type NormalReference } from 'dashboards/comparison/comparisonCoverage';
import { panelDataToTrendSamples } from 'dashboards/components/CheckDashboardHeader/headerMetricSparkline.utils';
import {
  BaselineSample,
  BaselineSummary,
  summarizeBaselineForRange,
} from 'dashboards/components/CheckDashboardHeader/health/baseline';
import {
  resolveCheckHealth,
} from 'dashboards/components/CheckDashboardHeader/health/checkHealth';
import { CheckHealthProvider } from 'dashboards/components/CheckDashboardHeader/health/CheckHealthContext';
import {
  bucketTrendSamples,
  classifyMetricTrend,
} from 'dashboards/components/CheckDashboardHeader/health/metricTrend';
import {
  DashboardPanelDefinition,
  useDashboardPanelQuery,
} from 'dashboards/hooks/useDashboardPanelQuery';
import { hasPanelDataQueryError } from 'dashboards/query/panelDataQueryState';

import {
  CheckHealthProviderProps,
  HeaderMetricDefinition,
} from 'dashboards/components/CheckDashboardHeader/CheckDashboardHeader.types';
import {
  HEALTH_EXPLANATION_PRIORITY,
  HealthEvidence,
  HealthEvidenceKind,
  HealthEvidenceProviderResult,
  HealthRange,
  MetricAlertModel,
  MetricTrendModel,
} from 'dashboards/components/CheckDashboardHeader/health/checkHealth.types';
import { CheckAlertPublished, CheckAlertType, HTTPCheck } from 'types';
import { useAppTime } from 'contexts/AppTimeProvider';
import {
  type AppTimeRangeMode,
  parseTimeIntervalMs,
} from 'contexts/AppTimeProvider.utils';
import { useDashboardComparison } from 'contexts/DashboardComparisonProvider';
import { useListAlertsForCheck } from 'data/useCheckAlerts';
import { getCheckRuntimeAlertState, useChecksAlertStates } from 'data/useCheckAlertStates';
import { useAlertAccessControl } from 'hooks/useAlertAccessControl';

import {
  compareLatencyToBaseline,
  compareRatioToBaseline,
  evaluateLatencyGuardrail,
  evaluateRatioGuardrail,
  evaluateSslGuardrail,
  HealthDecision,
} from './httpHealthPolicy';
import {
  getHttpTrendMaterialDelta,
  interpretHttpMetricTrend,
} from './httpMetricTrend';

type HttpMetricId = 'uptime' | 'reachability' | 'average-latency' | 'ssl-expiry';

export interface HealthPanelQueryResult {
  panelData: PanelData;
  isLoading: boolean;
}

interface BuildHttpCheckHealthModelArgs {
  check: HTTPCheck;
  metrics: Array<HeaderMetricDefinition<HTTPCheck>>;
  selected: {
    uptime: HealthPanelQueryResult;
    reachability: HealthPanelQueryResult;
    latency: HealthPanelQueryResult;
    ssl: HealthPanelQueryResult;
  };
  series: {
    uptime: HealthPanelQueryResult;
    reachability: HealthPanelQueryResult;
    latency: HealthPanelQueryResult;
    ssl: HealthPanelQueryResult;
  };
  baseline: {
    uptime: HealthPanelQueryResult;
    reachability: HealthPanelQueryResult;
    latency: HealthPanelQueryResult;
  };
  alerts: CheckAlertPublished[];
  alertsError?: Error;
  runtimeAlertNames: Set<string>;
  firingEpisodes: NamedAlertEpisode[];
  pendingEpisodes: NamedAlertEpisode[];
  canReadAlerts: boolean;
  canWriteAlerts: boolean;
  selectedRange: HealthRange;
  rangeMode: AppTimeRangeMode;
  healthReference: NormalReference;
}

type MetricPolicy = {
  id: HttpMetricId;
  label: string;
  selected: HealthPanelQueryResult;
  evaluateGuardrail: (value: number | null) => HealthDecision;
  baseline?: HealthPanelQueryResult;
  selectBaselineSamples?: (data: PanelData) => BaselineSample[];
  compareBaseline?: (value: number, baseline: BaselineSummary) => HealthDecision;
  alertType?: CheckAlertType;
  applicable: boolean;
  selectValue: (data: PanelData) => number | null;
  series: HealthPanelQueryResult;
};

function metricById(
  metrics: Array<HeaderMetricDefinition<HTTPCheck>>,
  metricId: HttpMetricId
): HeaderMetricDefinition<HTTPCheck> {
  const metric = metrics.find(({ id }) => id === metricId);

  if (!metric) {
    throw new Error(`HTTP header metric "${metricId}" is not defined`);
  }

  return metric;
}

function createEvidence({
  id,
  kind,
  metricId,
  range,
  scope,
  decision,
  detail,
}: {
  id: string;
  kind: HealthEvidence['kind'];
  metricId: HttpMetricId;
  range: HealthRange;
  scope: HealthEvidence['scope'];
  decision: HealthDecision;
  detail?: string;
}): HealthEvidence {
  return {
    id,
    kind,
    metricId,
    state: decision.state,
    summary: decision.summary,
    detail,
    range,
    scope,
    explanationPriority: HEALTH_EXPLANATION_PRIORITY[kind],
  };
}

function prefixDecision(label: string, decision: HealthDecision): HealthDecision {
  if (decision.summary.toLowerCase().startsWith(label.toLowerCase())) {
    return decision;
  }

  const separator =
    decision.state === 'unknown' || decision.summary.startsWith('Certificate') ? ': ' : ' is ';

  return {
    ...decision,
    summary: `${label}${separator}${decision.summary.charAt(0).toLowerCase()}${decision.summary.slice(1)}`,
  };
}

function createGuardrailResult(policies: MetricPolicy[], range: HealthRange): HealthEvidenceProviderResult {
  return {
    sourceId: 'http-guardrails',
    isLoading: false,
    evidence: policies.flatMap((policy) => {
      if (!policy.applicable) {
        return [];
      }

      const metric = policy.selected;
      const value = policyValue(policy);
      const decision = prefixDecision(policy.label, policy.evaluateGuardrail(value));

      return [
        createEvidence({
          id: `guardrail:${policy.id}`,
          kind: 'guardrail',
          metricId: policy.id,
          range,
          scope: 'range',
          decision,
          detail: metric.panelData.errors?.[0]?.message,
        }),
      ];
    }),
  };
}

function createBaselineResult(
  policies: MetricPolicy[],
  range: HealthRange,
  healthReference: NormalReference
): HealthEvidenceProviderResult & {
  hasInsufficientHistory: boolean;
  baselinesByMetric: Partial<Record<HttpMetricId, BaselineSummary>>;
} {
  if (healthReference.status !== 'available') {
    return {
      sourceId: 'http-baseline',
      isLoading: healthReference.status === 'checking',
      evidence: [],
      error:
        healthReference.status === 'query-error'
          ? new Error('Normal reference query failed')
          : undefined,
      hasInsufficientHistory: healthReference.status === 'not-established',
      baselinesByMetric: {},
    };
  }

  let hasInsufficientHistory = false;
  let firstError: Error | undefined;
  const baselinesByMetric: Partial<Record<HttpMetricId, BaselineSummary>> = {};
  const evidence = policies.flatMap<HealthEvidence>((policy) => {
    if (!policy.applicable || !policy.baseline || !policy.compareBaseline) {
      return [];
    }

    if (hasPanelDataQueryError(policy.baseline.panelData)) {
      const error = new Error(policy.baseline.panelData.errors?.[0]?.message ?? 'Baseline query failed');
      firstError ??= error;

      return [
        createEvidence({
          id: `baseline:${policy.id}:error`,
          kind: 'baseline',
          metricId: policy.id,
          range,
          scope: 'range',
          decision: {
            state: 'unknown',
            summary: `${policy.label} normal comparison is unavailable`,
          },
          detail: error.message,
        }),
      ];
    }

    if (policy.baseline.isLoading) {
      return [];
    }

    const baseline = summarizeBaselineForRange(
      policy.selectBaselineSamples?.(policy.baseline.panelData) ?? [],
      healthReference
    );

    if (!baseline) {
      hasInsufficientHistory = true;
      return [];
    }

    baselinesByMetric[policy.id] = baseline;
    const value = policyValue(policy);
    const decision =
      value === null
        ? { state: 'unknown' as const, summary: `${policy.label} selected-range value is unavailable` }
        : prefixDecision(policy.label, policy.compareBaseline(value, baseline));

    return [
      createEvidence({
        id: `baseline:${policy.id}`,
        kind: 'baseline',
        metricId: policy.id,
        range,
        scope: 'range',
        decision,
        detail: `Compared with the ${baseline.tier.label} median`,
      }),
    ];
  });

  return {
    sourceId: 'http-baseline',
    isLoading: policies.some((policy) => policy.baseline?.isLoading),
    evidence,
    error: firstError,
    hasInsufficientHistory,
    baselinesByMetric,
  };
}

function policyValue(policy: MetricPolicy): number | null {
  return policy.selectValue(policy.selected.panelData);
}

function rangesOverlap(left: HealthRange, right: HealthRange) {
  return left.from <= right.to && left.to >= right.from;
}

export function resolveMetricAlertModel({
  alertType,
  configured,
  isFiring,
  hasHistoricalEpisode,
  fireCount = 0,
  canWrite,
}: {
  alertType: CheckAlertType;
  configured?: CheckAlertPublished;
  isFiring: boolean;
  hasHistoricalEpisode: boolean;
  fireCount?: number;
  canWrite: boolean;
}): MetricAlertModel {
  if (configured?.error) {
    return { state: 'error', alertType, message: configured.error, canWrite };
  }

  if (configured?.status.startsWith('PENDING_')) {
    return { state: 'pending', alertType, message: configured.status, canWrite };
  }

  if (isFiring) {
    return { state: 'firing', alertType, fireCount: Math.max(fireCount, 1), canWrite };
  }

  if (hasHistoricalEpisode) {
    return { state: 'historical', alertType, fireCount, canWrite };
  }

  if (configured) {
    return { state: 'configured', alertType, canWrite };
  }

  return { state: 'not-configured', alertType, canWrite };
}

interface MetricAlertResolution {
  configured?: CheckAlertPublished;
  atEvaluation: boolean;
  resolvedInRange: boolean;
  resolvedAt?: number;
}

function createAlertResult({
  policies,
  alerts,
  alertsError,
  runtimeAlertNames,
  firingEpisodes,
  pendingEpisodes,
  canReadAlerts,
  canWriteAlerts,
  range,
  rangeMode,
}: {
  policies: MetricPolicy[];
  alerts: CheckAlertPublished[];
  alertsError?: Error;
  runtimeAlertNames: Set<string>;
  firingEpisodes: NamedAlertEpisode[];
  pendingEpisodes: NamedAlertEpisode[];
  canReadAlerts: boolean;
  canWriteAlerts: boolean;
  range: HealthRange;
  rangeMode: AppTimeRangeMode;
}): HealthEvidenceProviderResult & {
  alertsByMetric: Record<string, MetricAlertModel>;
  alertResolutionByMetric: Partial<Record<HttpMetricId, MetricAlertResolution>>;
} {
  const alertsByMetric: Record<string, MetricAlertModel> = {};
  const alertResolutionByMetric: Partial<Record<HttpMetricId, MetricAlertResolution>> = {};

  if (!canReadAlerts) {
    for (const policy of policies) {
      if (policy.alertType) {
        alertsByMetric[policy.id] = {
          state: 'unsupported',
          alertType: policy.alertType,
          message: 'Alert status is unavailable',
          canWrite: false,
        };
      }
    }

    return {
      sourceId: 'http-alerts',
      isLoading: false,
      evidence: [],
      alertsByMetric,
      alertResolutionByMetric,
    };
  }

  const evidence = policies.flatMap<HealthEvidence>((policy) => {
    const alertType = policy.alertType;

    if (!policy.applicable || !alertType) {
      return [];
    }

    const configured = alerts.find((alert) => alert.name === alertType);
    const overlappingFiringEpisodes = firingEpisodes.filter(
      (episode) =>
        episode.alertName === alertType &&
        rangesOverlap(range, { from: episode.from, to: episode.to })
    );
    const fireCount = overlappingFiringEpisodes.length;
    const historical = fireCount > 0;
    const pending = pendingEpisodes.some(
      (episode) =>
        episode.alertName === alertType &&
        rangesOverlap(range, { from: episode.from, to: episode.to })
    );
    const runtimeFiring = runtimeAlertNames.has(alertType);
    const episodeStateAtEnd = getAlertEpisodeStateAt(
      firingEpisodes,
      alertType,
      range.to,
      ALERT_EPISODE_END_TOLERANCE_MS
    );
    const atEvaluation =
      rangeMode === 'live' ? runtimeFiring : episodeStateAtEnd === 'firing';
    const resolvedEpisodes = overlappingFiringEpisodes.filter(
      (episode) => episode.to + ALERT_EPISODE_END_TOLERANCE_MS < range.to
    );
    const resolvedAt =
      resolvedEpisodes.length > 0
        ? Math.max(...resolvedEpisodes.map((episode) => episode.to))
        : undefined;
    alertResolutionByMetric[policy.id] = {
      configured,
      atEvaluation,
      resolvedInRange: historical && !atEvaluation,
      resolvedAt,
    };
    alertsByMetric[policy.id] = alertsError
      ? {
          state: 'error',
          alertType,
          message: alertsError.message,
          canWrite: canWriteAlerts,
        }
      : resolveMetricAlertModel({
          alertType,
          configured,
          isFiring: rangeMode === 'live' && runtimeFiring,
          hasHistoricalEpisode: historical,
          fireCount,
          canWrite: canWriteAlerts,
        });

    if (alertsError) {
      return [
        createEvidence({
          id: `alert:${policy.id}:error`,
          kind: 'alert',
          metricId: policy.id,
          range,
          scope: 'evaluation',
          decision: { state: 'unknown', summary: `${policy.label} alert status is unavailable` },
          detail: alertsError.message,
        }),
      ];
    }

    if (!configured) {
      return [];
    }

    if (configured.error || configured.status.startsWith('PENDING_') || pending) {
      return [
        createEvidence({
          id: `alert:${policy.id}:pending`,
          kind: 'alert',
          metricId: policy.id,
          range,
          scope: 'evaluation',
          decision: {
            state: 'unknown',
            summary: configured.error
              ? `${policy.label} alert configuration failed`
              : `${policy.label} alert is pending`,
          },
          detail: configured.error ?? configured.status,
        }),
      ];
    }

    const policyEvidence: HealthEvidence[] = [];

    if (historical) {
      policyEvidence.push(
        createEvidence({
          id: `alert:${policy.id}:historical`,
          kind: 'alert',
          metricId: policy.id,
          range,
          scope: 'range',
          decision: {
            state: 'unhealthy',
            summary: `${policy.label} was critical earlier in this range`,
          },
        })
      );
    }

    if (atEvaluation) {
      policyEvidence.push(
        createEvidence({
          id: `alert:${policy.id}:firing`,
          kind: 'alert',
          metricId: policy.id,
          range,
          scope: 'evaluation',
          decision: {
            state: 'unhealthy',
            summary:
              rangeMode === 'live'
                ? `${policy.label} alert is firing`
                : `${policy.label} alert was still firing when this range ended`,
          },
        })
      );
    } else {
      policyEvidence.push(
        createEvidence({
          id: `alert:${policy.id}:inactive`,
          kind: 'alert',
          metricId: policy.id,
          range,
          scope: 'evaluation',
          decision: {
            state: 'healthy',
            summary:
              rangeMode === 'live'
                ? `${policy.label} alert is not firing`
                : `${policy.label} alert was not firing when this range ended`,
          },
        })
      );
    }

    return policyEvidence;
  });

  return {
    sourceId: 'http-alerts',
    isLoading: false,
    evidence,
    error: alertsError,
    alertsByMetric,
    alertResolutionByMetric,
  };
}

interface PolicyTrendData {
  bucketedSamples: Array<{ at: number; value: number }>;
  shape: ReturnType<typeof classifyMetricTrend>;
  movement?: 'rising' | 'falling';
  latestValue: number | null;
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function getPolicyTrendData(
  policy: MetricPolicy,
  range: HealthRange,
  baseline?: BaselineSummary
): PolicyTrendData {
  const samples = panelDataToTrendSamples(policy.series.panelData);
  const maxBuckets = Math.min(48, Math.max(4, samples.length));
  const bucketedSamples = bucketTrendSamples({ samples, range, maxBuckets });
  const materialDelta = getHttpTrendMaterialDelta(policy.id, baseline);
  const shape = classifyMetricTrend({
    samples,
    range,
    materialDelta,
    maxBuckets,
  });
  const first = bucketedSamples[0]?.value;
  const last = bucketedSamples[bucketedSamples.length - 1]?.value;
  const movement =
    first === undefined || last === undefined || first === last
      ? undefined
      : last > first
        ? 'rising'
        : 'falling';
  const latestValues = bucketedSamples.slice(-3).map(({ value }) => value);

  return {
    bucketedSamples,
    shape,
    movement,
    latestValue: latestValues.length === 3 ? median(latestValues) : null,
  };
}

function createEndpointResult({
  policies,
  baselinesByMetric,
  alertResolutionByMetric,
  range,
}: {
  policies: MetricPolicy[];
  baselinesByMetric: Partial<Record<HttpMetricId, BaselineSummary>>;
  alertResolutionByMetric: Partial<Record<HttpMetricId, MetricAlertResolution>>;
  range: HealthRange;
}): HealthEvidenceProviderResult {
  const evidence = policies.flatMap<HealthEvidence>((policy) => {
    if (!policy.applicable || alertResolutionByMetric[policy.id]?.configured) {
      return [];
    }

    const trend = getPolicyTrendData(policy, range, baselinesByMetric[policy.id]);
    const baseline = baselinesByMetric[policy.id];
    let kind: HealthEvidenceKind = 'guardrail';
    let decision: HealthDecision;

    if (trend.latestValue === null) {
      decision = {
        state: 'unknown',
        summary: `${policy.label} health at the end of the range is unavailable`,
      };
    } else if (baseline && policy.compareBaseline) {
      kind = 'baseline';
      decision = prefixDecision(policy.label, policy.compareBaseline(trend.latestValue, baseline));
    } else {
      decision = prefixDecision(policy.label, policy.evaluateGuardrail(trend.latestValue));
    }

    return [
      createEvidence({
        id: `evaluation:${policy.id}`,
        kind,
        metricId: policy.id,
        range,
        scope: 'evaluation',
        decision,
        detail: baseline ? `Compared with the ${baseline.tier.label} median` : undefined,
      }),
    ];
  });

  return {
    sourceId: 'http-evaluation-point',
    evidence,
    isLoading: policies.some((policy) => policy.series.isLoading),
  };
}

function createTrendModels({
  policies,
  baselinesByMetric,
  alertResolutionByMetric,
  preliminaryStates,
  range,
  rangeMode,
  checkFrequency,
}: {
  policies: MetricPolicy[];
  baselinesByMetric: Partial<Record<HttpMetricId, BaselineSummary>>;
  alertResolutionByMetric: Partial<Record<HttpMetricId, MetricAlertResolution>>;
  preliminaryStates: ReturnType<typeof resolveCheckHealth>['metrics'];
  range: HealthRange;
  rangeMode: AppTimeRangeMode;
  checkFrequency: number;
}): Record<string, MetricTrendModel> {
  return Object.fromEntries(
    policies.flatMap<[string, MetricTrendModel]>((policy) => {
      if (!policy.applicable) {
        return [];
      }

      const baseline = baselinesByMetric[policy.id];
      const trend = getPolicyTrendData(policy, range, baseline);
      const resolution = alertResolutionByMetric[policy.id];
      const health = preliminaryStates[policy.id];
      const source: HealthEvidenceKind | 'none' = resolution?.configured
        ? 'alert'
        : baseline
          ? 'baseline'
          : trend.shape === 'insufficient'
            ? 'none'
            : 'guardrail';
      const configuredPeriodMs = resolution?.configured?.period
        ? parseTimeIntervalMs(resolution.configured.period) ?? 0
        : 0;
      const stabilisationMs = Math.max(checkFrequency * 3, configuredPeriodMs);
      const resolvedAt = resolution?.resolvedAt;
      const postResolutionSamples =
        resolvedAt === undefined
          ? []
          : trend.bucketedSamples.filter(({ at }) => at > resolvedAt);
      const postResolutionSpan =
        postResolutionSamples.length >= 2
          ? postResolutionSamples[postResolutionSamples.length - 1].at - postResolutionSamples[0].at
          : 0;
      const stabilised = resolution?.configured
        ? resolution.resolvedInRange &&
          !resolution.atEvaluation &&
          health.state === 'healthy' &&
          postResolutionSamples.length >= 3 &&
          postResolutionSpan >= stabilisationMs
        : health.state === 'healthy' && trend.bucketedSamples.length >= 3;

      return [
        [
          policy.id,
          interpretHttpMetricTrend({
            metricId: policy.id,
            shape: trend.shape,
            movement: trend.movement,
            evaluationState: health.state,
            rangeState: health.rangeState,
            source,
            rangeMode,
            rangeValue: policyValue(policy),
            alertAtEvaluation: resolution?.atEvaluation,
            alertResolvedInRange: resolution?.resolvedInRange,
            stabilised,
          }),
        ],
      ];
    })
  );
}

export function buildHttpCheckHealthModel({
  check,
  metrics,
  selected,
  series,
  baseline,
  alerts,
  alertsError,
  runtimeAlertNames,
  firingEpisodes,
  pendingEpisodes,
  canReadAlerts,
  canWriteAlerts,
  selectedRange,
  rangeMode,
  healthReference,
}: BuildHttpCheckHealthModelArgs) {
  const definitions = {
    uptime: metricById(metrics, 'uptime'),
    reachability: metricById(metrics, 'reachability'),
    latency: metricById(metrics, 'average-latency'),
    ssl: metricById(metrics, 'ssl-expiry'),
  };

  const policies: MetricPolicy[] = [
    {
      id: 'uptime',
      label: 'Uptime',
      selected: selected.uptime,
      series: series.uptime,
      evaluateGuardrail: evaluateRatioGuardrail,
      baseline: baseline.uptime,
      selectBaselineSamples: definitions.uptime.comparison?.normalBaseline?.selectSamples,
      compareBaseline: compareRatioToBaseline,
      applicable: true,
      selectValue: definitions.uptime.selectValue,
    },
    {
      id: 'reachability',
      label: 'Reachability',
      selected: selected.reachability,
      series: series.reachability,
      evaluateGuardrail: evaluateRatioGuardrail,
      baseline: baseline.reachability,
      selectBaselineSamples: definitions.reachability.comparison?.normalBaseline?.selectSamples,
      compareBaseline: compareRatioToBaseline,
      alertType: definitions.reachability.health?.alertTypes?.[0],
      applicable: true,
      selectValue: definitions.reachability.selectValue,
    },
    {
      id: 'average-latency',
      label: 'Average latency',
      selected: selected.latency,
      series: series.latency,
      evaluateGuardrail: evaluateLatencyGuardrail,
      baseline: baseline.latency,
      selectBaselineSamples: definitions.latency.comparison?.normalBaseline?.selectSamples,
      compareBaseline: compareLatencyToBaseline,
      alertType: definitions.latency.health?.alertTypes?.[0],
      applicable: true,
      selectValue: definitions.latency.selectValue,
    },
    {
      id: 'ssl-expiry',
      label: 'SSL expiry',
      selected: selected.ssl,
      series: series.ssl,
      evaluateGuardrail: evaluateSslGuardrail,
      alertType: definitions.ssl.health?.alertTypes?.[0],
      applicable: check.target.startsWith('https://') || definitions.ssl.selectValue(selected.ssl.panelData) !== null,
      selectValue: definitions.ssl.selectValue,
    },
  ];
  const guardrail = createGuardrailResult(policies, selectedRange);
  const learnedBaseline = createBaselineResult(policies, selectedRange, healthReference);
  const alertEvidence = createAlertResult({
    policies,
    alerts,
    alertsError,
    runtimeAlertNames,
    firingEpisodes,
    pendingEpisodes,
    canReadAlerts,
    canWriteAlerts,
    range: selectedRange,
    rangeMode,
  });
  const endpoint = createEndpointResult({
    policies,
    baselinesByMetric: learnedBaseline.baselinesByMetric,
    alertResolutionByMetric: alertEvidence.alertResolutionByMetric,
    range: selectedRange,
  });
  const qualifiers = [
    ...(learnedBaseline.hasInsufficientHistory ? ['Normal not established yet'] : []),
    ...(learnedBaseline.error || alertEvidence.error ? ['Some health evidence is unavailable'] : []),
  ];
  const evidence = [
    ...alertEvidence.evidence,
    ...endpoint.evidence,
    ...guardrail.evidence,
    ...learnedBaseline.evidence,
  ];
  const commonModelInput = {
    metricIds: metrics.map(({ id }) => id),
    evidence,
    qualifiers,
    alerts: alertEvidence.alertsByMetric,
    liveIncidentCount: rangeMode === 'historical' ? runtimeAlertNames.size : 0,
    rangeMode,
    evaluationAt: selectedRange.to,
  };
  const preliminary = resolveCheckHealth(commonModelInput);
  const trends = createTrendModels({
    policies,
    baselinesByMetric: learnedBaseline.baselinesByMetric,
    alertResolutionByMetric: alertEvidence.alertResolutionByMetric,
    preliminaryStates: preliminary.metrics,
    range: selectedRange,
    rangeMode,
    checkFrequency: check.frequency,
  });

  return resolveCheckHealth({
    ...commonModelInput,
    trends,
  });
}

function useHealthPanel(
  definition: DashboardPanelDefinition,
  range?: HealthRange,
  enabled?: boolean
): HealthPanelQueryResult {
  const query = useDashboardPanelQuery(
    definition,
    range || enabled !== undefined ? { range, enabled } : undefined
  );
  return { panelData: query.panelData, isLoading: query.isLoading };
}

function requireNormalBaselineDefinition(
  metric: HeaderMetricDefinition<HTTPCheck>
): DashboardPanelDefinition {
  const definition = metric.comparison?.normalBaseline?.definition;

  if (!definition) {
    throw new Error(`HTTP header metric "${metric.id}" has no Normal baseline definition`);
  }

  return definition;
}

export function HttpCheckHealthProvider({
  check,
  metrics,
  children,
}: PropsWithChildren<CheckHealthProviderProps<HTTPCheck>>) {
  const { absolute, rangeMode } = useAppTime();
  const { healthReference } = useDashboardComparison();
  const selectedRange = absolute;
  const baselineRange = healthReference.status === 'available' ? healthReference.range : undefined;
  const baselineEnabled = healthReference.status === 'available';
  const definitions = {
    uptime: metricById(metrics, 'uptime'),
    reachability: metricById(metrics, 'reachability'),
    latency: metricById(metrics, 'average-latency'),
    ssl: metricById(metrics, 'ssl-expiry'),
  };
  const uptime = useHealthPanel(definitions.uptime.definition);
  const reachability = useHealthPanel(definitions.reachability.definition);
  const latency = useHealthPanel(definitions.latency.definition);
  const ssl = useHealthPanel(definitions.ssl.definition);
  const uptimeSeries = useHealthPanel(
    definitions.uptime.sparkline?.definition ?? definitions.uptime.definition
  );
  const reachabilitySeries = useHealthPanel(
    definitions.reachability.sparkline?.definition ?? definitions.reachability.definition
  );
  const latencySeries = useHealthPanel(
    definitions.latency.sparkline?.definition ?? definitions.latency.definition
  );
  const sslSeries = useHealthPanel(
    definitions.ssl.sparkline?.definition ?? definitions.ssl.definition
  );
  const uptimeBaseline = useHealthPanel(
    requireNormalBaselineDefinition(definitions.uptime),
    baselineRange,
    baselineEnabled
  );
  const reachabilityBaseline = useHealthPanel(
    requireNormalBaselineDefinition(definitions.reachability),
    baselineRange,
    baselineEnabled
  );
  const latencyBaseline = useHealthPanel(
    requireNormalBaselineDefinition(definitions.latency),
    baselineRange,
    baselineEnabled
  );
  const access = useAlertAccessControl();
  const alertsQuery = useListAlertsForCheck(access.canReadAlerts ? check.id : undefined);
  const runtimeAlertsQuery = useChecksAlertStates(access.canReadAlerts ? [check] : []);
  const reachabilityFiring = useDashboardAlertEpisodes(
    CheckAlertType.ProbeFailedExecutionsTooHigh,
    'Show alerts firing'
  );
  const latencyFiring = useDashboardAlertEpisodes(
    CheckAlertType.HTTPRequestDurationTooHighAvg,
    'Show alerts firing'
  );
  const sslFiring = useDashboardAlertEpisodes(
    CheckAlertType.TLSTargetCertificateCloseToExpiring,
    'Show alerts firing'
  );
  const reachabilityPending = useDashboardAlertEpisodes(
    CheckAlertType.ProbeFailedExecutionsTooHigh,
    'Show alerts pending'
  );
  const latencyPending = useDashboardAlertEpisodes(
    CheckAlertType.HTTPRequestDurationTooHighAvg,
    'Show alerts pending'
  );
  const sslPending = useDashboardAlertEpisodes(
    CheckAlertType.TLSTargetCertificateCloseToExpiring,
    'Show alerts pending'
  );
  const runtimeAlertNames = getCheckRuntimeAlertState(runtimeAlertsQuery.data ?? {}, check).firingAlertNames;
  const alertsError = alertsQuery.error instanceof Error ? alertsQuery.error : undefined;
  const model = buildHttpCheckHealthModel({
    check,
    metrics,
    selected: { uptime, reachability, latency, ssl },
    series: {
      uptime: uptimeSeries,
      reachability: reachabilitySeries,
      latency: latencySeries,
      ssl: sslSeries,
    },
    baseline: {
      uptime: uptimeBaseline,
      reachability: reachabilityBaseline,
      latency: latencyBaseline,
    },
    alerts: alertsQuery.data ?? check.alerts ?? [],
    alertsError,
    runtimeAlertNames,
    firingEpisodes: [...reachabilityFiring, ...latencyFiring, ...sslFiring],
    pendingEpisodes: [...reachabilityPending, ...latencyPending, ...sslPending],
    canReadAlerts: access.canReadAlerts,
    canWriteAlerts: access.canWriteAlerts,
    selectedRange,
    rangeMode,
    healthReference,
  });

  return <CheckHealthProvider value={model}>{children}</CheckHealthProvider>;
}
