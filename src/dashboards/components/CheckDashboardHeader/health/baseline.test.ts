import {
  bucketBaselineSamples,
  median,
  medianAbsoluteDeviation,
  selectBaselineTier,
  summarizeBaseline,
} from './baseline';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const selectedFrom = Date.UTC(2026, 6, 23, 12);

function hourlySamples(hours: number, value = 0.999) {
  return Array.from({ length: hours }, (_, index) => ({
    at: selectedFrom - (index + 1) * HOUR_MS,
    value,
  }));
}

describe('baseline statistics', () => {
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

  it('selects the longest tier with at least eighty percent populated buckets', () => {
    const tier = selectBaselineTier(hourlySamples(14 * 24), selectedFrom);

    expect(tier).toMatchObject({
      durationMs: 14 * DAY_MS,
      label: '14-day',
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
});
