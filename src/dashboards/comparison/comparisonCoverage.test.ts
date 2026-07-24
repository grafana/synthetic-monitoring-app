import { type BaselineSample } from 'dashboards/components/CheckDashboardHeader/health/baseline';

import {
  classifyManualCoverage,
  NORMAL_TIERS,
  selectNormalReference,
} from './comparisonCoverage';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const primaryFrom = Date.UTC(2026, 6, 23, 12);

function hourlySamples(hours: number, value = 1): BaselineSample[] {
  return Array.from({ length: hours }, (_, index) => ({
    at: primaryFrom - (index + 0.5) * HOUR_MS,
    value,
  }));
}

describe('comparison coverage', () => {
  it('selects the 30-day normal tier at exactly eighty percent coverage', () => {
    expect(selectNormalReference(hourlySamples(576), primaryFrom)).toEqual({
      status: 'available',
      tierId: '30d',
      range: { from: primaryFrom - 30 * DAY_MS, to: primaryFrom },
      coverage: 0.8,
      executionCount: 576,
    });
  });

  it('falls back to the next qualifying tier below the 30-day threshold', () => {
    expect(selectNormalReference(hourlySamples(575), primaryFrom)).toMatchObject({
      status: 'available',
      tierId: '21d',
      range: { from: primaryFrom - 21 * DAY_MS, to: primaryFrom },
      coverage: 1,
      executionCount: 504,
    });
  });

  it('includes 21 days in the fallback order and excludes 72 hours', () => {
    expect(NORMAL_TIERS.map((tier) => tier.id)).toEqual(['30d', '21d', '14d', '7d', '24h']);
  });

  it('treats zero execution counts as uncovered buckets', () => {
    expect(selectNormalReference(hourlySamples(24, 0), primaryFrom)).toEqual({
      status: 'not-established',
    });
  });

  it('counts a populated hour once while summing all completed executions', () => {
    const samples = [
      ...hourlySamples(24),
      { at: primaryFrom - 0.25 * HOUR_MS, value: 2 },
      { at: primaryFrom - 0.75 * HOUR_MS, value: 3 },
    ];

    expect(selectNormalReference(samples, primaryFrom)).toMatchObject({
      status: 'available',
      tierId: '24h',
      coverage: 1,
      executionCount: 29,
    });
  });

  it('classifies a half-covered manual range as partial', () => {
    const reference = { from: primaryFrom - 2 * HOUR_MS, to: primaryFrom };

    expect(
      classifyManualCoverage(
        [
          { at: reference.from + 0.5 * HOUR_MS, value: 4 },
          { at: reference.from + 1.5 * HOUR_MS, value: 0 },
        ],
        reference
      )
    ).toEqual({
      status: 'partial',
      coverage: 0.5,
      executionCount: 4,
    });
  });

  it('treats range-query timestamps as window ends for a manual reference', () => {
    const reference = { from: primaryFrom - HOUR_MS, to: primaryFrom };

    expect(
      classifyManualCoverage(
        [
          { at: reference.from, value: 100 },
          { at: reference.to, value: 2 },
        ],
        reference
      )
    ).toEqual({
      status: 'available',
      coverage: 1,
      executionCount: 2,
    });
  });

  it('assigns exact hourly range-query endpoints to the preceding relative hour', () => {
    const reference = { from: primaryFrom - 3 * HOUR_MS, to: primaryFrom };

    expect(
      classifyManualCoverage(
        [
          { at: reference.from, value: 100 },
          { at: reference.from + HOUR_MS, value: 2 },
          { at: reference.from + 2 * HOUR_MS, value: 3 },
          { at: reference.to, value: 4 },
        ],
        reference
      )
    ).toEqual({
      status: 'available',
      coverage: 1,
      executionCount: 9,
    });
  });

  it('selects Normal from realistic hourly window-end timestamps including primaryFrom', () => {
    const samples = Array.from({ length: 24 }, (_, index) => ({
      at: primaryFrom - (23 - index) * HOUR_MS,
      value: 1,
    }));

    expect(selectNormalReference(samples, primaryFrom)).toMatchObject({
      status: 'available',
      tierId: '24h',
      coverage: 1,
      executionCount: 24,
    });
  });

  it('ignores non-finite timestamps and values', () => {
    const reference = { from: primaryFrom - 2 * HOUR_MS, to: primaryFrom };

    expect(
      classifyManualCoverage(
        [
          { at: reference.from + 0.5 * HOUR_MS, value: 1 },
          { at: Number.NaN, value: 10 },
          { at: Number.POSITIVE_INFINITY, value: 10 },
          { at: reference.from + 1.5 * HOUR_MS, value: Number.NaN },
          { at: reference.from + 1.5 * HOUR_MS, value: Number.POSITIVE_INFINITY },
        ],
        reference
      )
    ).toEqual({
      status: 'partial',
      coverage: 0.5,
      executionCount: 1,
    });
  });

  it('does not count negative samples as executions or covered buckets', () => {
    const reference = { from: primaryFrom - 2 * HOUR_MS, to: primaryFrom };

    expect(
      classifyManualCoverage(
        [
          { at: reference.from + 0.5 * HOUR_MS, value: 2 },
          { at: reference.from + 1.5 * HOUR_MS, value: -3 },
        ],
        reference
      )
    ).toEqual({
      status: 'partial',
      coverage: 0.5,
      executionCount: 2,
    });
  });

  it('classifies an empty reference before known retention as outside retention', () => {
    const reference = { from: primaryFrom - 30 * DAY_MS, to: primaryFrom - 29 * DAY_MS };

    expect(classifyManualCoverage([], reference, reference.to + 1)).toEqual({
      status: 'outside-retention',
    });
  });

  it('classifies an empty reference ending exactly at retention as outside retention', () => {
    const reference = { from: primaryFrom - 30 * DAY_MS, to: primaryFrom - 29 * DAY_MS };

    expect(classifyManualCoverage([], reference, reference.to)).toEqual({
      status: 'outside-retention',
    });
  });

  it('classifies an empty reference without a retention boundary as having no retained executions', () => {
    const reference = { from: primaryFrom - DAY_MS, to: primaryFrom };

    expect(classifyManualCoverage([], reference)).toEqual({
      status: 'no-retained-executions',
    });
  });
});
