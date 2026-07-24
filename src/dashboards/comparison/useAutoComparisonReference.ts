import { useEffect, useMemo, useState } from 'react';
import { FieldType, type PanelData } from '@grafana/data';
import {
  type DashboardPanelDefinition,
  useDashboardPanelQuery,
} from 'dashboards/hooks/useDashboardPanelQuery';
import { hasPanelDataQueryError } from 'dashboards/query/panelDataQueryState';

import { type ComparisonRange } from './comparisonReference.types';

import {
  advanceAutoComparisonSelection,
  type AutoCandidateOutcome,
  type AutoComparisonPresetId,
  type AutoComparisonSelectionState,
  createAutoComparisonSelection,
} from './autoComparisonSelection';
import { classifyManualCoverage } from './comparisonCoverage';
import { resolveComparisonReference } from './resolveComparisonReference';

export type AutomaticComparisonState =
  | { status: 'inactive' }
  | { status: 'finding'; candidatePresetId: AutoComparisonPresetId }
  | { status: 'no-data' }
  | { status: 'query-error' };

export interface AutoComparisonReferenceResult {
  automaticSelection: AutomaticComparisonState;
  resolvedReference?: { kind: 'baseline'; presetId: AutoComparisonPresetId };
}

interface SelectionAttempt {
  key: string;
  selection: AutoComparisonSelectionState;
}

export function useAutoComparisonReference({
  definition,
  enabled,
  knownRetentionBoundary,
  primary,
  retryToken,
  timezone,
}: {
  definition: DashboardPanelDefinition;
  enabled: boolean;
  knownRetentionBoundary?: number;
  primary: ComparisonRange;
  retryToken: number;
  timezone: string;
}): AutoComparisonReferenceResult {
  const attemptKey = `${enabled ? 'enabled' : 'disabled'}:${primary.from}:${primary.to}:${timezone}:${retryToken}`;
  const [attempt, setAttempt] = useState<SelectionAttempt>(() => ({
    key: attemptKey,
    selection: createAutoComparisonSelection(),
  }));
  const isCurrentAttempt = attempt.key === attemptKey;
  const selection = isCurrentAttempt ? attempt.selection : createAutoComparisonSelection();
  const resolution = useMemo(
    () =>
      selection.status === 'finding'
        ? resolveComparisonReference(
            { kind: 'baseline', presetId: selection.candidatePresetId },
            primary,
            timezone
          )
        : null,
    [primary, selection, timezone]
  );
  const queryEnabled = enabled && isCurrentAttempt && resolution?.status === 'valid';
  const queryRange = resolution?.status === 'valid' ? resolution.range : primary;
  const query = useDashboardPanelQuery(definition, {
    range: queryRange,
    enabled: queryEnabled,
  });

  useEffect(() => {
    if (isCurrentAttempt) {
      return;
    }

    setAttempt({
      key: attemptKey,
      selection: createAutoComparisonSelection(),
    });
  }, [attemptKey, isCurrentAttempt]);

  useEffect(() => {
    if (!queryEnabled || query.isLoading || selection.status !== 'finding') {
      return;
    }

    const outcome = candidateOutcome(
      query.panelData,
      queryRange,
      knownRetentionBoundary
    );

    setAttempt((current) => {
      if (current.key !== attemptKey || current.selection.status !== 'finding') {
        return current;
      }

      return {
        key: current.key,
        selection: advanceAutoComparisonSelection(current.selection, outcome),
      };
    });
  }, [
    attemptKey,
    knownRetentionBoundary,
    query.isLoading,
    query.panelData,
    queryEnabled,
    queryRange,
    selection.status,
  ]);

  if (!enabled) {
    return { automaticSelection: { status: 'inactive' } };
  }

  if (selection.status === 'resolved') {
    return {
      automaticSelection: {
        status: 'finding',
        candidatePresetId: selection.presetId,
      },
      resolvedReference: {
        kind: 'baseline',
        presetId: selection.presetId,
      },
    };
  }

  if (selection.status === 'finding') {
    return {
      automaticSelection: {
        status: 'finding',
        candidatePresetId: selection.candidatePresetId,
      },
    };
  }

  return { automaticSelection: selection };
}

function candidateOutcome(
  panelData: PanelData,
  range: ComparisonRange,
  knownRetentionBoundary?: number
): AutoCandidateOutcome {
  if (hasPanelDataQueryError(panelData)) {
    return 'query-error';
  }

  const availability = classifyManualCoverage(
    panelDataToPresenceSamples(panelData),
    range,
    knownRetentionBoundary
  );

  switch (availability.status) {
    case 'available':
    case 'partial':
      return availability.status;
    case 'outside-retention':
      return 'outside-retention';
    case 'no-retained-executions':
      return 'empty';
    case 'query-error':
      return 'query-error';
    case 'checking':
    case 'invalid-range':
    case 'overlaps-primary':
    case 'unknown-preset':
      return 'empty';
  }
}

function panelDataToPresenceSamples(data: PanelData): Array<{ at: number; value: number }> {
  return data.series.flatMap((frame) => {
    const timeField = frame.fields.find(
      (field) => field.type === FieldType.time || field.name.toLowerCase() === 'time'
    );
    const valueField = frame.fields.find((field) => field.type === FieldType.number);

    if (!timeField || !valueField) {
      return [];
    }

    const times = valuesToArray(timeField.values);
    const values = valuesToArray(valueField.values);

    return times.flatMap((at, index) => {
      const value = values[index];

      return typeof at === 'number' &&
        Number.isFinite(at) &&
        typeof value === 'number' &&
        Number.isFinite(value)
        ? [{ at, value }]
        : [];
    });
  });
}

function valuesToArray(values: ArrayLike<unknown> | { toArray: () => unknown[] }): unknown[] {
  return typeof (values as { toArray?: () => unknown[] }).toArray === 'function'
    ? (values as { toArray: () => unknown[] }).toArray()
    : Array.from(values as ArrayLike<unknown>);
}
