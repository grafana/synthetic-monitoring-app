import { FieldSparkline, type PanelData } from '@grafana/data';
import { type ManualReferenceAvailability } from 'dashboards/comparison/comparisonCoverage';
import { useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';
import { hasPanelDataQueryError } from 'dashboards/query/panelDataQueryState';

import type { HeaderMetricDefinition } from './CheckDashboardHeader.types';
import { type ResolvedDisplayReference } from 'dashboards/comparison/comparisonReference.types';
import type { Check } from 'types';
import { type DashboardComparisonContextValue, useDashboardComparison } from 'contexts/DashboardComparisonProvider';

import type { MetricComparisonReadings } from './MetricComparisonReading';

export type HeaderMetricComparisonVisual =
  | {
      kind: 'overlay';
      series: FieldSparkline;
      label: string;
    }
  | {
      kind: 'baseline-average';
      value: number;
      label: string;
    }
  | {
      kind: 'summary-only';
    };

export interface HeaderMetricComparisonModel {
  state: 'loading' | 'ready' | 'unavailable';
  readings?: MetricComparisonReadings;
  caption?: string;
  detail?: string;
  message?: string;
  visual?: HeaderMetricComparisonVisual;
}

type DisplayAvailability = DashboardComparisonContextValue['displayAvailability'];
type ValidDisplayReference = Extract<ResolvedDisplayReference, { status: 'valid' }>;

export function useHeaderMetricComparison<TCheck extends Check>({
  metric,
  primaryValue,
  primaryData,
}: {
  metric: HeaderMetricDefinition<TCheck>;
  primaryValue: number | null;
  primaryData: PanelData;
}): HeaderMetricComparisonModel | null {
  const {
    automaticSelection,
    displayAvailability,
    displayReference,
    enabled,
  } = useDashboardComparison();
  const comparison = metric.comparison;
  const referenceReady =
    enabled &&
    comparison !== undefined &&
    displayReference?.status === 'valid' &&
    isAvailabilityReady(displayAvailability);
  const visualMode = getVisualMode(metric, displayReference);
  const visualQueryEnabled = referenceReady && visualMode === 'overlay';
  const fallbackRange = panelTimeRange(primaryData);
  const referenceRange =
    displayReference?.status === 'valid' ? displayReference.range : fallbackRange;
  const valueQuery = useDashboardPanelQuery(metric.definition, {
    range: referenceRange,
    enabled: referenceReady,
  });
  const visualQuery = useDashboardPanelQuery(metric.sparkline?.definition ?? metric.definition, {
    range: referenceRange,
    enabled: visualQueryEnabled,
  });

  if (!enabled || !comparison) {
    return null;
  }

  if (!displayReference && automaticSelection.status !== 'inactive') {
    switch (automaticSelection.status) {
      case 'finding':
        return { state: 'loading' };
      case 'no-data':
        return { state: 'unavailable', message: 'No comparison data found' };
      case 'query-error':
        return { state: 'unavailable', message: 'Could not find comparison data' };
    }
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
    hasPanelDataQueryError(valueQuery.panelData) ||
    (visualQueryEnabled && hasPanelDataQueryError(visualQuery.panelData))
  ) {
    return {
      state: 'unavailable',
      message: 'Comparison unavailable',
    };
  }

  if (valueQuery.isLoading || (visualQueryEnabled && visualQuery.isLoading)) {
    return { state: 'loading' };
  }

  const referenceValue = metric.selectValue(valueQuery.panelData);

  if (referenceValue === null || !Number.isFinite(referenceValue)) {
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
    referenceData: valueQuery.panelData,
  });

  if (!copy) {
    return {
      state: 'unavailable',
      message: `No ${displayReference.label} data for ${metric.label}`,
    };
  }

  return {
    state: 'ready',
    readings: {
      plain: copy.plain,
      reference: metric.formatValue(referenceValue),
    },
    caption: `Compared to ${displayReference.label}`,
    detail: appendReferenceDetail(copy.detail, displayAvailability),
    visual: createVisual(metric, displayReference, visualMode, visualQuery.panelData, referenceValue),
  };
}

function getVisualMode<TCheck extends Check>(
  metric: HeaderMetricDefinition<TCheck>,
  reference: ResolvedDisplayReference | null
): HeaderMetricComparisonVisual['kind'] {
  if (reference?.status !== 'valid' || !metric.sparkline) {
    return 'summary-only';
  }

  if (reference.spec.kind === 'baseline' && metric.comparison?.normalBaseline) {
    return 'baseline-average';
  }

  return reference.equalDuration ? 'overlay' : 'summary-only';
}

function createVisual<TCheck extends Check>(
  metric: HeaderMetricDefinition<TCheck>,
  reference: ValidDisplayReference,
  mode: HeaderMetricComparisonVisual['kind'],
  data: PanelData,
  referenceValue: number
): HeaderMetricComparisonVisual {
  if (mode === 'baseline-average') {
    return {
      kind: 'baseline-average',
      value: referenceValue,
      label: `${reference.label} average`,
    };
  }

  if (mode !== 'overlay') {
    return { kind: 'summary-only' };
  }

  const series = metric.sparkline?.selectSeries(data);

  return series
    ? {
        kind: 'overlay',
        series,
        label: reference.label,
      }
    : { kind: 'summary-only' };
}

function appendReferenceDetail(
  detail: string | undefined,
  availability: DisplayAvailability
): string | undefined {
  if (
    !availability ||
    !('coverage' in availability) ||
    (availability.status !== 'partial' && availability.coverage >= 1)
  ) {
    return detail;
  }

  const coverage = `${Math.round(availability.coverage * 100)}% coverage · ${Math.round(
    availability.executionCount
  ).toLocaleString()} executions`;

  return detail ? `${detail} · ${coverage}` : coverage;
}

function isAvailabilityReady(
  availability: DisplayAvailability
): availability is Extract<ManualReferenceAvailability, { status: 'available' | 'partial' }> {
  return availability?.status === 'available' || availability?.status === 'partial';
}

function unavailableMessage(
  reference: ResolvedDisplayReference | null,
  availability: DisplayAvailability
): string {
  const availabilityReason =
    availability?.status === 'available' || availability?.status === 'partial'
      ? undefined
      : availability?.status;
  const reason =
    availabilityReason ?? (reference?.status === 'invalid' ? reference.reason : undefined);

  switch (reason) {
    case 'checking':
      return 'Loading comparison';
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
