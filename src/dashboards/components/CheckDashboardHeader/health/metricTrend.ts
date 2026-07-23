import type { HealthRange, MetricTrendShape } from './checkHealth.types';

export interface TrendSample {
  at: number;
  value: number;
}

export interface TrendClassifierOptions {
  samples: TrendSample[];
  range: HealthRange;
  materialDelta: number;
  maxBuckets?: number;
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function bucketTrendSamples({
  samples,
  range,
  maxBuckets,
}: Pick<TrendClassifierOptions, 'samples' | 'range'> & { maxBuckets: number }): TrendSample[] {
  const duration = range.to - range.from;

  if (duration <= 0 || maxBuckets <= 0) {
    return [];
  }

  const buckets = Array.from({ length: maxBuckets }, () => [] as number[]);

  for (const sample of samples) {
    if (
      !Number.isFinite(sample.at) ||
      !Number.isFinite(sample.value) ||
      sample.at < range.from ||
      sample.at > range.to
    ) {
      continue;
    }

    const rawIndex = Math.floor(((sample.at - range.from) / duration) * maxBuckets);
    const index = Math.min(rawIndex, maxBuckets - 1);
    buckets[index].push(sample.value);
  }

  const bucketDuration = duration / maxBuckets;

  return buckets.flatMap<TrendSample>((bucket, index) =>
    bucket.length > 0
      ? [{ at: range.from + (index + 1) * bucketDuration, value: median(bucket) }]
      : []
  );
}

function directionReversals(values: number[], materialDelta: number): number {
  const directions = values
    .slice(1)
    .map((value, index) => value - values[index])
    .filter((delta) => Math.abs(delta) >= materialDelta)
    .map((delta) => Math.sign(delta));

  return directions.slice(1).filter((direction, index) => direction !== directions[index]).length;
}

export function classifyMetricTrend({
  samples,
  range,
  materialDelta,
  maxBuckets = 48,
}: TrendClassifierOptions): MetricTrendShape {
  const bucketedSamples = bucketTrendSamples({ samples, range, maxBuckets });
  const values = bucketedSamples.map(({ value }) => value);

  if (values.length < 4 || values.length / maxBuckets < 0.5) {
    return 'insufficient';
  }

  const quarterSize = Math.max(1, Math.floor(values.length / 4));
  const startValues = values.slice(0, quarterSize);
  const endValues = values.slice(-quarterSize);
  const middleValues = values.slice(quarterSize, -quarterSize);
  const start = median(startValues);
  const end = median(endValues);
  const netMovement = end - start;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const totalExcursion = maximum - minimum;
  const middleExcursion =
    middleValues.length === 0
      ? 0
      : Math.max(...middleValues.map((value) => Math.abs(value - start)));

  if (Math.abs(netMovement) <= materialDelta && middleExcursion >= 2 * materialDelta) {
    return 'returned';
  }

  if (
    directionReversals(values, materialDelta) >= 3 ||
    (totalExcursion >= 2 * materialDelta && Math.abs(netMovement) < materialDelta)
  ) {
    return 'variable';
  }

  const startSpread = Math.max(...startValues) - Math.min(...startValues);
  const endSpread = Math.max(...endValues) - Math.min(...endValues);
  const maximumAdjacentMovement = Math.max(
    ...values.slice(1).map((value, index) => Math.abs(value - values[index]))
  );

  if (
    Math.abs(netMovement) >= materialDelta &&
    startSpread <= materialDelta / 2 &&
    endSpread <= materialDelta / 2 &&
    maximumAdjacentMovement >= materialDelta
  ) {
    return 'shifted';
  }

  if (netMovement >= materialDelta) {
    return 'rising';
  }

  if (netMovement <= -materialDelta) {
    return 'falling';
  }

  return 'stable';
}
