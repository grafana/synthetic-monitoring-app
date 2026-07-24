import {
  BaselineTierLabel,
  bucketBaselineSamples,
  median,
  medianAbsoluteDeviation,
  selectBaselineTier,
  summarizeBaseline,
  summarizeBaselineForRange,
} from './baseline';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const selectedFrom = Date.UTC(2026, 6, 23, 12);
type ApprovedBaselineTierLabel = '30-day' | '21-day' | '14-day' | '7-day' | '24-hour';
type TypesAreEqual<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2
    ? true
    : false;
const baselineTierLabelsMatchApprovedLadder: TypesAreEqual<
  BaselineTierLabel,
  ApprovedBaselineTierLabel
> = true;

function hourlySamples(hours: number, value = 0.999) {
  return Array.from({ length: hours }, (_, index) => ({
    at: selectedFrom - index * HOUR_MS,
    value,
  }));
}

describe('baseline statistics', () => {
  it('uses exactly the approved Normal tier labels', () => {
    expect(baselineTierLabelsMatchApprovedLadder).toBe(true);
  });

  it('calculates a robust median and median absolute deviation', () => {
    expect(median([1, 2, 100, 3, 4])).toBe(3);
    expect(medianAbsoluteDeviation([1, 2, 100, 3, 4])).toBe(1);
    expect(median([])).toBeNull();
    expect(medianAbsoluteDeviation([])).toBeNull();
  });

  it('aggregates multiple samples into fixed hourly buckets', () => {
    const samples = [
      { at: selectedFrom - 30 * 60 * 1000, value: 0.8 },
      { at: selectedFrom - 45 * 60 * 1000, value: 1 },
      { at: selectedFrom - 90 * 60 * 1000, value: 0.6 },
    ];

    expect(bucketBaselineSamples(samples, selectedFrom - 2 * HOUR_MS, selectedFrom)).toEqual([
      { at: selectedFrom - 2 * HOUR_MS, value: 0.6 },
      { at: selectedFrom - HOUR_MS, value: 0.9 },
    ]);
  });

  it('uses Prometheus window-end semantics at the absolute range boundaries', () => {
    const rangeFrom = selectedFrom - 2 * HOUR_MS;
    const samples = [
      { at: rangeFrom, value: 100 },
      { at: rangeFrom + HOUR_MS, value: 0.6 },
      { at: selectedFrom, value: 0.8 },
      { at: selectedFrom + 1, value: 100 },
    ];

    expect(bucketBaselineSamples(samples, rangeFrom, selectedFrom)).toEqual([
      { at: rangeFrom, value: 0.6 },
      { at: selectedFrom - HOUR_MS, value: 0.8 },
    ]);
  });

  it('maps first- and last-hour window ends to their preceding relative buckets', () => {
    const rangeFrom = selectedFrom - 2 * HOUR_MS;

    expect(
      bucketBaselineSamples(
        [
          { at: rangeFrom + 1, value: 0.5 },
          { at: rangeFrom + HOUR_MS, value: 0.7 },
          { at: selectedFrom, value: 0.9 },
        ],
        rangeFrom,
        selectedFrom
      )
    ).toEqual([
      { at: rangeFrom, value: 0.6 },
      { at: selectedFrom - HOUR_MS, value: 0.9 },
    ]);
  });

  it('selects the longest tier with at least eighty percent populated buckets', () => {
    const tier = selectBaselineTier(hourlySamples(14 * 24), selectedFrom);

    expect(tier).toMatchObject({
      durationMs: 14 * DAY_MS,
      label: '14-day',
      coverage: 1,
    });
  });

  it('includes twenty-one days in the tier ladder', () => {
    expect(selectBaselineTier(hourlySamples(21 * 24), selectedFrom)).toMatchObject({
      durationMs: 21 * DAY_MS,
      label: '21-day',
      coverage: 1,
    });
  });

  it('uses bucket coverage instead of assuming a constant execution frequency', () => {
    const recentHourly = hourlySamples(18 * 24);
    const olderFiveMinute = Array.from({ length: 12 * 24 * 12 }, (_, index) => ({
      at: selectedFrom - 18 * DAY_MS - (index + 1) * 5 * 60 * 1000,
      value: 0.999,
    }));

    expect(selectBaselineTier([...recentHourly, ...olderFiveMinute], selectedFrom)).toMatchObject({
      durationMs: 30 * DAY_MS,
      label: '30-day',
      coverage: 1,
    });
  });

  it('returns no baseline below twenty-four usable hours', () => {
    expect(selectBaselineTier(hourlySamples(18), selectedFrom)).toBeNull();
  });

  it('summarizes only the selected tier’s hourly values', () => {
    const summary = summarizeBaseline(hourlySamples(24, 0.8), selectedFrom);

    expect(summary).toMatchObject({
      median: 0.8,
      mad: 0,
      tier: { label: '24-hour', coverage: 1 },
    });
  });

  it('ignores non-finite values and samples outside the candidate history', () => {
    const samples = [
      ...hourlySamples(24),
      { at: selectedFrom - 31 * DAY_MS, value: 0.1 },
      { at: selectedFrom - HOUR_MS, value: Number.NaN },
    ];

    expect(selectBaselineTier(samples, selectedFrom)).toMatchObject({
      durationMs: DAY_MS,
      label: '24-hour',
      coverage: 1,
    });
  });

  it('summarizes only the provider-selected absolute Normal range', () => {
    const normal = {
      status: 'available' as const,
      tierId: '21d' as const,
      range: { from: selectedFrom - 21 * DAY_MS, to: selectedFrom },
      coverage: 0.9,
      executionCount: 500,
    };
    const summary = summarizeBaselineForRange(
      [
        { at: normal.range.from - 1, value: 100 },
        ...hourlySamples(21 * 24, 0.8),
        { at: normal.range.to + 1, value: 100 },
      ],
      normal
    );

    expect(summary).toMatchObject({
      median: 0.8,
      mad: 0,
      tier: {
        durationMs: 21 * DAY_MS,
        label: '21-day',
        coverage: 0.9,
      },
    });
    expect(summary?.tier.samples).toHaveLength(21 * 24);
    expect(summary?.tier.samples[0]).toEqual({ at: normal.range.from, value: 0.8 });
    expect(summary?.tier.samples.at(-1)).toEqual({ at: normal.range.to - HOUR_MS, value: 0.8 });
  });
});
