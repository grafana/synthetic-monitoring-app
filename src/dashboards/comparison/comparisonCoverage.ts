import { type BaselineSample } from 'dashboards/components/CheckDashboardHeader/health/baseline';

import { type ComparisonRange } from './comparisonReference.types';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MINIMUM_NORMAL_COVERAGE = 0.8;

export type NormalTierId = '30d' | '21d' | '14d' | '7d' | '24h';

export type NormalReference =
  | {
      status: 'available';
      tierId: NormalTierId;
      range: ComparisonRange;
      coverage: number;
      executionCount: number;
    }
  | {
      status: 'not-established' | 'checking' | 'query-error';
    };

export type ManualReferenceAvailability =
  | { status: 'checking' }
  | {
      status: 'available' | 'partial';
      coverage: number;
      executionCount: number;
    }
  | { status: 'outside-retention' }
  | { status: 'no-retained-executions' }
  | { status: 'query-error' }
  | { status: 'overlaps-primary' | 'unknown-preset' | 'invalid-range' };

export const NORMAL_TIERS = [
  { id: '30d', durationMs: 30 * DAY_MS },
  { id: '21d', durationMs: 21 * DAY_MS },
  { id: '14d', durationMs: 14 * DAY_MS },
  { id: '7d', durationMs: 7 * DAY_MS },
  { id: '24h', durationMs: DAY_MS },
] as const;

function summarizeCoverage(
  samples: BaselineSample[],
  range: ComparisonRange
): { coverage: number; executionCount: number } {
  const bucketTotals = new Map<number, number>();
  let executionCount = 0;

  for (const sample of samples) {
    if (
      !Number.isFinite(sample.at) ||
      !Number.isFinite(sample.value) ||
      sample.at <= range.from ||
      sample.at > range.to
    ) {
      continue;
    }

    const bucket = Math.ceil((sample.at - range.from) / HOUR_MS) - 1;
    bucketTotals.set(bucket, (bucketTotals.get(bucket) ?? 0) + sample.value);

    if (sample.value >= 0) {
      executionCount += sample.value;
    }
  }

  const coveredBucketCount = Array.from(bucketTotals.values()).filter((total) => total > 0).length;
  const bucketCount = Math.ceil((range.to - range.from) / HOUR_MS);

  return {
    coverage: bucketCount > 0 ? coveredBucketCount / bucketCount : 0,
    executionCount,
  };
}

export function selectNormalReference(samples: BaselineSample[], primaryFrom: number): NormalReference {
  if (!Number.isFinite(primaryFrom)) {
    return { status: 'not-established' };
  }

  for (const tier of NORMAL_TIERS) {
    const range = {
      from: primaryFrom - tier.durationMs,
      to: primaryFrom,
    };
    const summary = summarizeCoverage(samples, range);

    if (summary.coverage >= MINIMUM_NORMAL_COVERAGE) {
      return {
        status: 'available',
        tierId: tier.id,
        range,
        ...summary,
      };
    }
  }

  return { status: 'not-established' };
}

export function classifyManualCoverage(
  samples: BaselineSample[],
  reference: ComparisonRange,
  retainedFrom?: number
): ManualReferenceAvailability {
  if (
    !Number.isFinite(reference.from) ||
    !Number.isFinite(reference.to) ||
    reference.to <= reference.from
  ) {
    return { status: 'invalid-range' };
  }

  const summary = summarizeCoverage(samples, reference);

  if (summary.executionCount === 0) {
    if (Number.isFinite(retainedFrom) && retainedFrom! >= reference.to) {
      return { status: 'outside-retention' };
    }

    return { status: 'no-retained-executions' };
  }

  return {
    status: summary.coverage === 1 ? 'available' : 'partial',
    ...summary,
  };
}
