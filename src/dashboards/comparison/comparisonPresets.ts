import { dateTimeForTimeZone } from '@grafana/data';
import { type TimeZone } from '@grafana/schema';

import { type ComparisonPreset } from './comparisonReference.types';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function baselinePreset(id: string, label: string, order: number, durationMs: number): ComparisonPreset {
  return {
    id,
    label,
    order,
    resolve: (primary) => ({
      from: primary.from - durationMs,
      to: primary.from,
    }),
  };
}

function shiftedDurationPreset(id: string, label: string, order: number, shiftMs: number): ComparisonPreset {
  return {
    id,
    label,
    order,
    resolve: (primary) => {
      const duration = primary.to - primary.from;
      const from = primary.from - shiftMs;

      return { from, to: from + duration };
    },
  };
}

function calendarPreset(
  id: string,
  label: string,
  order: number,
  amount: number,
  unit: 'month' | 'year'
): ComparisonPreset {
  return {
    id,
    label,
    order,
    resolve: (primary, timezone) => {
      const duration = primary.to - primary.from;
      const from = dateTimeForTimeZone(timezone as TimeZone, primary.from).subtract(amount, unit).valueOf();

      return { from, to: from + duration };
    },
  };
}

export const BASELINE_COMPARISON_PRESETS: ComparisonPreset[] = [
  baselinePreset('30d', 'Last 30 days', 1, 30 * DAY_MS),
  baselinePreset('21d', 'Last 21 days', 2, 21 * DAY_MS),
  baselinePreset('14d', 'Last 14 days', 3, 14 * DAY_MS),
  baselinePreset('7d', 'Last 7 days', 4, 7 * DAY_MS),
  baselinePreset('24h', 'Last 24 hours', 5, DAY_MS),
];

export const SAME_PERIOD_COMPARISON_PRESETS: ComparisonPreset[] = [
  shiftedDurationPreset('24h', 'Same period yesterday', 1, DAY_MS),
  shiftedDurationPreset('7d', 'Same period last week', 2, 7 * DAY_MS),
  calendarPreset('1m', 'Same period last month', 3, 1, 'month'),
];
