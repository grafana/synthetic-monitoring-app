import { dateTime } from '@grafana/data';

import {
  ComparisonRange,
  ComparisonReferenceValidation,
  ExplicitComparisonReferenceSpec,
} from './comparisonReference.types';

import {
  BASELINE_COMPARISON_PRESETS,
  SAME_PERIOD_COMPARISON_PRESETS,
} from './comparisonPresets';

export function rangesOverlap(left: ComparisonRange, right: ComparisonRange): boolean {
  return left.from < right.to && right.from < left.to;
}

export function setLockedCustomBoundary({
  boundary,
  value,
  primaryDurationMs,
  current,
}: {
  boundary: 'from' | 'to';
  value: number;
  primaryDurationMs: number;
  current: ComparisonRange;
}): ComparisonRange {
  return boundary === 'from'
    ? { from: value, to: value + primaryDurationMs }
    : { from: value - primaryDurationMs, to: value };
}

export function resolveComparisonReference(
  spec: ExplicitComparisonReferenceSpec,
  primary: ComparisonRange,
  timezone: string
): ComparisonReferenceValidation {
  if (!isValidRange(primary)) {
    return { status: 'invalid', reason: 'invalid-range' };
  }

  if (spec.kind === 'previous') {
    const duration = primary.to - primary.from;

    return valid({ from: primary.from - duration, to: primary.from }, primary);
  }

  if (spec.kind === 'baseline') {
    const preset = BASELINE_COMPARISON_PRESETS.find(({ id }) => id === spec.presetId);

    if (!preset) {
      return { status: 'invalid', reason: 'unknown-preset' };
    }

    return valid(preset.resolve(primary, timezone), primary);
  }

  if (spec.kind === 'shifted') {
    const preset = SAME_PERIOD_COMPARISON_PRESETS.find(({ id }) => id === spec.presetId);

    if (!preset) {
      return { status: 'invalid', reason: 'unknown-preset' };
    }

    return valid(preset.resolve(primary, timezone), primary);
  }

  if (spec.kind === 'custom') {
    const range = { from: parseTimestamp(spec.from), to: parseTimestamp(spec.to) };

    if (!isValidRange(range)) {
      return { status: 'invalid', reason: 'invalid-range' };
    }

    if (rangesOverlap(range, primary)) {
      return { status: 'invalid', reason: 'overlaps-primary' };
    }

    return valid(range, primary);
  }

  return assertNever(spec);
}

function valid(range: ComparisonRange, primary: ComparisonRange): ComparisonReferenceValidation {
  return {
    status: 'valid',
    range,
    equalDuration: range.to - range.from === primary.to - primary.from,
  };
}

function isValidRange(range: ComparisonRange): boolean {
  return Number.isFinite(range.from) && Number.isFinite(range.to) && range.from < range.to;
}

function parseTimestamp(value: string): number {
  return Number.isFinite(Date.parse(value)) ? dateTime(value).valueOf() : Number.NaN;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported explicit comparison reference: ${JSON.stringify(value)}`);
}
