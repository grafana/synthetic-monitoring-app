import { dateTimeForTimeZone } from '@grafana/data';
import { type TimeZone } from '@grafana/schema';

import { type ComparisonPreset } from './comparisonReference.types';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function durationPreset(id: string, label: string, order: number, shiftMs: number): ComparisonPreset {
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

export const COMPARISON_PRESETS: ComparisonPreset[] = [
  durationPreset('24h', '24 hours ago', 1, 24 * HOUR_MS),
  durationPreset('7d', '7 days ago', 2, 7 * DAY_MS),
  durationPreset('14d', '14 days ago', 3, 14 * DAY_MS),
  durationPreset('21d', '21 days ago', 4, 21 * DAY_MS),
  durationPreset('30d', '30 days ago', 5, 30 * DAY_MS),
  calendarPreset('3m', '3 months ago', 6, 3, 'month'),
  calendarPreset('1y', '1 year ago', 7, 1, 'year'),
];
