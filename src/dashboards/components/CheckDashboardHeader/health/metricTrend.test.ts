import { bucketTrendSamples, classifyMetricTrend } from './metricTrend';

const MINUTE_MS = 60_000;
const range = { from: 0, to: 8 * MINUTE_MS };

function samples(values: number[]) {
  return values.map((value, index) => ({ at: index * MINUTE_MS + 1, value }));
}

function classify(values: number[], materialDelta = 0.2) {
  return classifyMetricTrend({
    samples: samples(values),
    range,
    materialDelta,
    maxBuckets: 8,
  });
}

describe('classifyMetricTrend', () => {
  it.each([
    [[1, 1, 1, 1, 1, 1, 1, 1], 'stable'],
    [[1, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6], 'rising'],
    [[1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1, 1], 'falling'],
    [[1, 1.5, 1, 1.6, 1, 1.4, 1, 1.5], 'variable'],
    [[1, 1, 2, 2.2, 1.8, 1.1, 1, 1], 'returned'],
    [[1, 1, 1, 1, 1.5, 1.5, 1.5, 1.5], 'shifted'],
  ] as const)('classifies %p as %s', (values, expected) => {
    expect(classify([...values])).toBe(expected);
  });

  it('does not weight a denser part of the range more heavily', () => {
    const denseMiddle = Array.from({ length: 100 }, (_, index) => ({
      at: 2 * MINUTE_MS + index * ((4 * MINUTE_MS) / 100),
      value: 2,
    }));

    expect(
      classifyMetricTrend({
        samples: [
          { at: 1, value: 1 },
          { at: MINUTE_MS + 1, value: 1 },
          ...denseMiddle,
          { at: 6 * MINUTE_MS + 1, value: 1 },
          { at: 7 * MINUTE_MS + 1, value: 1 },
        ],
        range,
        materialDelta: 0.2,
        maxBuckets: 8,
      })
    ).toBe('returned');
  });

  it('returns insufficient when fewer than four time buckets are populated', () => {
    expect(classify([1, 2, 3])).toBe('insufficient');
  });

  it('ignores invalid and out-of-range samples', () => {
    expect(
      classifyMetricTrend({
        samples: [
          { at: -1, value: 100 },
          { at: 1, value: 1 },
          { at: MINUTE_MS + 1, value: Number.NaN },
          { at: 2 * MINUTE_MS + 1, value: 1 },
          { at: 4 * MINUTE_MS + 1, value: 1 },
          { at: 6 * MINUTE_MS + 1, value: 1 },
          { at: range.to + 1, value: 100 },
        ],
        range,
        materialDelta: 0.2,
        maxBuckets: 4,
      })
    ).toBe('stable');
  });

  it('keeps sub-material noise stable', () => {
    expect(classify([1, 1.05, 0.96, 1.04, 0.98, 1.03, 0.97, 1], 0.1)).toBe('stable');
  });
});

describe('bucketTrendSamples', () => {
  it('uses one median per equal-duration bucket', () => {
    expect(
      bucketTrendSamples({
        samples: [
          { at: 1, value: 1 },
          { at: 10_000, value: 100 },
          { at: MINUTE_MS + 1, value: 2 },
          { at: 2 * MINUTE_MS + 1, value: 3 },
          { at: 3 * MINUTE_MS + 1, value: 4 },
        ],
        range: { from: 0, to: 4 * MINUTE_MS },
        maxBuckets: 4,
      })
    ).toEqual([
      { at: MINUTE_MS, value: 50.5 },
      { at: 2 * MINUTE_MS, value: 2 },
      { at: 3 * MINUTE_MS, value: 3 },
      { at: 4 * MINUTE_MS, value: 4 },
    ]);
  });
});
