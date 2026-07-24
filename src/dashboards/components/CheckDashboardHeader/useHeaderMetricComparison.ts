import { FieldSparkline, type PanelData } from '@grafana/data';
import { type ManualReferenceAvailability, type NormalReference } from 'dashboards/comparison/comparisonCoverage';
import {
  type BaselineSummary,
  summarizeBaselineForRange,
} from 'dashboards/components/CheckDashboardHeader/health/baseline';
import { useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';
import { hasPanelDataQueryError } from 'dashboards/query/panelDataQueryState';

import type { HeaderMetricDefinition } from './CheckDashboardHeader.types';
import { type ResolvedDisplayReference } from 'dashboards/comparison/comparisonReference.types';
import type { Check } from 'types';
import { type DashboardComparisonContextValue, useDashboardComparison } from 'contexts/DashboardComparisonProvider';

export type HeaderMetricComparisonVisual =
  | {
      kind: 'normal-band';
      lower: number;
      median: number;
      upper: number;
      label: string;
    }
  | {
      kind: 'overlay';
      series: FieldSparkline;
      label: string;
    }
  | {
      kind: 'summary-only';
    };

export interface HeaderMetricComparisonModel {
  state: 'loading' | 'ready' | 'unavailable';
  summary?: string;
  detail?: string;
  message?: string;
  visual?: HeaderMetricComparisonVisual;
}

type DisplayAvailability = DashboardComparisonContextValue['displayAvailability'];
type ComparisonMetric = Pick<HeaderMetricDefinition, 'comparison' | 'sparkline'>;

export function useHeaderMetricComparison<TCheck extends Check>({
  metric,
  primaryValue,
  primaryData,
}: {
  metric: HeaderMetricDefinition<TCheck>;
  primaryValue: number | null;
  primaryData: PanelData;
}): HeaderMetricComparisonModel | null {
  const { displayAvailability, displayReference, enabled } = useDashboardComparison();
  const comparison = metric.comparison;
  const isNormalReference =
    displayReference?.status === 'valid' && displayReference.spec.kind === 'normal';
  const normalBaseline = comparison?.normalBaseline;
  const referenceReady =
    enabled &&
    comparison !== undefined &&
    displayReference?.status === 'valid' &&
    isAvailabilityReady(displayAvailability);
  const visualMode = getVisualMode(metric, displayReference);
  const valueQueryEnabled = referenceReady && (!isNormalReference || !normalBaseline);
  const visualQueryEnabled = referenceReady && visualMode === 'overlay';
  const normalBaselineQueryEnabled = referenceReady && isNormalReference && normalBaseline !== undefined;
  const fallbackRange = panelTimeRange(primaryData);
  const referenceRange = displayReference?.status === 'valid' ? displayReference.range : fallbackRange;
  const valueQuery = useDashboardPanelQuery(metric.definition, {
    range: referenceRange,
    enabled: valueQueryEnabled,
  });
  const visualQuery = useDashboardPanelQuery(metric.sparkline?.definition ?? metric.definition, {
    range: referenceRange,
    enabled: visualQueryEnabled,
  });
  const normalBaselineQuery = useDashboardPanelQuery(normalBaseline?.definition ?? metric.definition, {
    range: referenceRange,
    enabled: normalBaselineQueryEnabled,
  });

  if (!enabled || !comparison) {
    return null;
  }

  if (!isAvailabilityReady(displayAvailability)) {
    if (displayAvailability?.status === 'checking') {
      return { state: 'loading' };
    }

    return {
      state: 'unavailable',
      message: unavailableMessage(displayReference, displayAvailability),
    };
  }

  if (!displayReference || displayReference.status === 'invalid') {
    return {
      state: 'unavailable',
      message: unavailableMessage(displayReference, displayAvailability),
    };
  }

  if (
    (valueQueryEnabled && hasPanelDataQueryError(valueQuery.panelData)) ||
    (visualQueryEnabled && hasPanelDataQueryError(visualQuery.panelData)) ||
    (normalBaselineQueryEnabled && hasPanelDataQueryError(normalBaselineQuery.panelData))
  ) {
    return {
      state: 'unavailable',
      message: 'Comparison unavailable',
    };
  }

  if (
    (valueQueryEnabled && valueQuery.isLoading) ||
    (visualQueryEnabled && visualQuery.isLoading) ||
    (normalBaselineQueryEnabled && normalBaselineQuery.isLoading)
  ) {
    return { state: 'loading' };
  }

  const normalSummary =
    isNormalReference && normalBaseline && isAvailableNormalReference(displayAvailability)
      ? summarizeBaselineForRange(
          normalBaseline.selectSamples(normalBaselineQuery.panelData),
          displayAvailability
        )
      : null;
  const visual =
    visualMode === 'normal-band'
      ? createNormalVisual(metric, displayReference, normalSummary)
      : createVisual(metric, displayReference, visualMode, visualQuery.panelData);
  const selectedReferenceValue = metric.selectValue(valueQuery.panelData);
  const referenceValue = normalSummary?.median ?? selectedReferenceValue;

  if (
    !Number.isFinite(referenceValue) ||
    (visualMode === 'normal-band' && visual.kind !== 'normal-band')
  ) {
    return {
      state: 'unavailable',
      message: `No ${displayReference.label} data for ${metric.label}`,
    };
  }

  const copy = comparison.compare({
    primary: primaryValue,
    reference: referenceValue,
    referenceKind: displayReference.spec.kind,
    referenceLabel: displayReference.label,
    primaryDurationMs: rangeDuration(fallbackRange),
    referenceDurationMs: rangeDuration(displayReference.range),
    primaryData,
    referenceData: normalSummary ? normalBaselineQuery.panelData : valueQuery.panelData,
  });

  return {
    state: 'ready',
    summary: copy?.summary,
    detail: appendReferenceDetail(copy?.detail, displayAvailability),
    visual,
  };
}

function getVisualMode(
  metric: ComparisonMetric,
  reference: ResolvedDisplayReference | null
): HeaderMetricComparisonVisual['kind'] {
  if (reference?.status !== 'valid' || !metric.sparkline) {
    return 'summary-only';
  }

  if (reference.spec.kind === 'normal') {
    return metric.comparison?.supportsNormalBand ? 'normal-band' : 'summary-only';
  }

  return reference.equalDuration ? 'overlay' : 'summary-only';
}

function createVisual(
  metric: ComparisonMetric,
  reference: Extract<ResolvedDisplayReference, { status: 'valid' }>,
  mode: HeaderMetricComparisonVisual['kind'],
  data: PanelData
): HeaderMetricComparisonVisual {
  if (mode !== 'overlay') {
    return { kind: 'summary-only' };
  }

  const series = metric.sparkline?.selectSeries(data);

  if (!series) {
    return { kind: 'summary-only' };
  }

  return {
    kind: 'overlay',
    series,
    label: reference.label,
  };
}

function createNormalVisual(
  metric: ComparisonMetric,
  reference: Extract<ResolvedDisplayReference, { status: 'valid' }>,
  summary: BaselineSummary | null
): HeaderMetricComparisonVisual {
  if (!summary) {
    return { kind: 'summary-only' };
  }

  return {
    kind: 'normal-band',
    lower: clamp(summary.median - 3 * summary.mad, metric.comparison?.normalBandDomain),
    median: summary.median,
    upper: clamp(summary.median + 3 * summary.mad, metric.comparison?.normalBandDomain),
    label: reference.label,
  };
}

function clamp(value: number, domain?: { min?: number; max?: number }): number {
  return Math.min(domain?.max ?? Number.POSITIVE_INFINITY, Math.max(domain?.min ?? Number.NEGATIVE_INFINITY, value));
}

function appendReferenceDetail(detail: string | undefined, availability: DisplayAvailability): string | undefined {
  if (availability?.status === 'available' && 'tierId' in availability) {
    const normalEvidence = `Normal · ${availability.tierId} · ${Math.round(availability.coverage * 100)}% coverage · ${Math.round(
      availability.executionCount
    ).toLocaleString()} executions`;

    return detail ? `${detail} · ${normalEvidence}` : normalEvidence;
  }

  if (
    !availability ||
    !('coverage' in availability) ||
    (availability.status !== 'partial' && availability.coverage >= 1)
  ) {
    return detail;
  }

  const coverage = `${Math.round(availability.coverage * 100)}% coverage · ${Math.round(availability.executionCount).toLocaleString()} executions`;

  return detail ? `${detail} · ${coverage}` : coverage;
}

function isAvailabilityReady(
  availability: DisplayAvailability
): availability is
  | Extract<ManualReferenceAvailability, { status: 'available' | 'partial' }>
  | Extract<NormalReference, { status: 'available' }> {
  return availability?.status === 'available' || availability?.status === 'partial';
}

function isAvailableNormalReference(
  availability: DisplayAvailability
): availability is Extract<NormalReference, { status: 'available' }> {
  return availability?.status === 'available' && 'tierId' in availability;
}

function unavailableMessage(reference: ResolvedDisplayReference | null, availability: DisplayAvailability): string {
  const availabilityReason =
    availability?.status === 'available' || availability?.status === 'partial'
      ? undefined
      : availability?.status;
  const reason = availabilityReason ?? (reference?.status === 'invalid' ? reference.reason : undefined);

  switch (reason) {
    case 'checking':
      return 'Loading comparison';
    case 'normal-not-established':
    case 'not-established':
      return 'Normal not established for this period';
    case 'outside-retention':
      return 'Comparison is outside retention';
    case 'no-retained-executions':
      return 'No retained executions';
    case 'overlaps-primary':
      return 'Comparison overlaps the selected range';
    case 'unknown-preset':
      return 'Unknown comparison preset';
    case 'invalid-range':
      return 'Invalid comparison range';
    case 'query-error':
    case undefined:
      return 'Comparison unavailable';
  }
}

function panelTimeRange(data: PanelData): { from: number; to: number } {
  return {
    from: data.timeRange.from.valueOf(),
    to: data.timeRange.to.valueOf(),
  };
}

function rangeDuration(range: { from: number; to: number }): number {
  return Math.max(0, range.to - range.from);
}
