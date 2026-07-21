import { dateTime, DateTime, IntervalRange, rangeUtil, TimeRange } from '@grafana/data';

import { DEFAULT_QUERY_FROM_TIME } from 'components/constants';

export const DEFAULT_APP_TIME_RANGE = {
  from: `now-${DEFAULT_QUERY_FROM_TIME}`,
  to: 'now',
} as const;

export const DEFAULT_APP_TIMEZONE = 'browser';

export function resolveTimeRange(from: string, to: string): TimeRange {
  const raw: IntervalRange = {
    from,
    to,
  };

  return rangeUtil.convertRawToRange(raw, DEFAULT_APP_TIMEZONE);
}

export function getAbsoluteBounds(range: TimeRange): { from: number; to: number } {
  return {
    from: dateTime(range.from).valueOf(),
    to: dateTime(range.to).valueOf(),
  };
}

export function refreshRelativeRange(from: string, to: string): { from: string; to: string } {
  if (isRelativeRange(from, to)) {
    return { from, to };
  }

  return { from, to };
}

export function isRelativeRange(from: string, to: string): boolean {
  return from.startsWith('now') || to.startsWith('now');
}

export function toRawRange(from: DateTime, to: DateTime) {
  return {
    from: from.toString(),
    to: to.toString(),
  };
}
