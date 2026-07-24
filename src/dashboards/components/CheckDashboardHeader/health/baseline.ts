import { type NormalReference, type NormalTierId } from 'dashboards/comparison/comparisonCoverage';

export interface BaselineSample {
  at: number;
  value: number;
}

export type BaselineTierLabel = '30-day' | '21-day' | '14-day' | '7-day' | '24-hour';

export interface BaselineTier {
  durationMs: number;
  label: BaselineTierLabel;
  samples: BaselineSample[];
  coverage: number;
}

export interface BaselineSummary {
  median: number;
  mad: number;
  tier: BaselineTier;
}

export const BASELINE_BUCKET_MS = 60 * 60 * 1000;
export const BASELINE_MINIMUM_COVERAGE = 0.8;

const DAY_MS = 24 * BASELINE_BUCKET_MS;
const BASELINE_TIERS: Array<Pick<BaselineTier, 'durationMs' | 'label'>> = [
  { durationMs: 30 * DAY_MS, label: '30-day' },
  { durationMs: 21 * DAY_MS, label: '21-day' },
  { durationMs: 14 * DAY_MS, label: '14-day' },
  { durationMs: 7 * DAY_MS, label: '7-day' },
  { durationMs: DAY_MS, label: '24-hour' },
];
const BASELINE_TIER_LABELS: Record<NormalTierId, BaselineTierLabel> = {
  '30d': '30-day',
  '21d': '21-day',
  '14d': '14-day',
  '7d': '7-day',
  '24h': '24-hour',
};

export function median(values: number[]): number | null {
  const sorted = values.filter(Number.isFinite).sort((left, right) => left - right);

  if (sorted.length === 0) {
    return null;
  }

  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function medianAbsoluteDeviation(values: number[]): number | null {
  const centre = median(values);

  if (centre === null) {
    return null;
  }

  return median(values.map((value) => Math.abs(value - centre)));
}

export function bucketBaselineSamples(
  samples: BaselineSample[],
  rangeFrom: number,
  rangeTo: number
): BaselineSample[] {
  const buckets = new Map<number, { total: number; count: number }>();

  for (const sample of samples) {
    if (
      sample.at <= rangeFrom ||
      sample.at > rangeTo ||
      !Number.isFinite(sample.at) ||
      !Number.isFinite(sample.value)
    ) {
      continue;
    }

    // Prometheus range-query samples describe the window ending at their timestamp.
    // Keep (from, to] and assign exact endpoints to the preceding relative hour.
    const bucketIndex = Math.ceil((sample.at - rangeFrom) / BASELINE_BUCKET_MS) - 1;
    const bucketAt = rangeFrom + bucketIndex * BASELINE_BUCKET_MS;
    const current = buckets.get(bucketAt) ?? { total: 0, count: 0 };
    current.total += sample.value;
    current.count += 1;
    buckets.set(bucketAt, current);
  }

  return Array.from(buckets, ([at, bucket]) => ({
    at,
    value: bucket.total / bucket.count,
  })).sort((left, right) => left.at - right.at);
}

export function selectBaselineTier(samples: BaselineSample[], selectedFrom: number): BaselineTier | null {
  for (const tier of BASELINE_TIERS) {
    const rangeFrom = selectedFrom - tier.durationMs;
    const bucketedSamples = bucketBaselineSamples(samples, rangeFrom, selectedFrom);
    const bucketCount = Math.ceil(tier.durationMs / BASELINE_BUCKET_MS);
    const coverage = bucketedSamples.length / bucketCount;

    if (coverage >= BASELINE_MINIMUM_COVERAGE) {
      return {
        ...tier,
        samples: bucketedSamples,
        coverage,
      };
    }
  }

  return null;
}

export function summarizeBaseline(samples: BaselineSample[], selectedFrom: number): BaselineSummary | null {
  const tier = selectBaselineTier(samples, selectedFrom);

  if (!tier) {
    return null;
  }

  const values = tier.samples.map((sample) => sample.value);
  const centre = median(values);
  const mad = medianAbsoluteDeviation(values);

  if (centre === null || mad === null) {
    return null;
  }

  return {
    median: centre,
    mad,
    tier,
  };
}

export function summarizeBaselineForRange(
  samples: BaselineSample[],
  normal: Extract<NormalReference, { status: 'available' }>
): BaselineSummary | null {
  const durationMs = normal.range.to - normal.range.from;
  const bucketedSamples = bucketBaselineSamples(samples, normal.range.from, normal.range.to);
  const bucketCount = Math.ceil(durationMs / BASELINE_BUCKET_MS);
  const metricCoverage = bucketCount > 0 ? bucketedSamples.length / bucketCount : 0;

  if (metricCoverage < BASELINE_MINIMUM_COVERAGE) {
    return null;
  }

  const values = bucketedSamples.map((sample) => sample.value);
  const centre = median(values);
  const mad = medianAbsoluteDeviation(values);

  if (centre === null || mad === null) {
    return null;
  }

  return {
    median: centre,
    mad,
    tier: {
      durationMs,
      label: BASELINE_TIER_LABELS[normal.tierId],
      samples: bucketedSamples,
      coverage: normal.coverage,
    },
  };
}
