import { DateTime, dateTime, rangeUtil, TimeRange, toUtc } from '@grafana/data';

import { DEFAULT_QUERY_FROM_TIME } from 'components/constants';

export const DEFAULT_APP_TIME_RANGE = {
  from: `now-${DEFAULT_QUERY_FROM_TIME}`,
  to: 'now',
} as const;

export const DEFAULT_APP_TIMEZONE = 'browser';

export type AppTimeRangeMode = 'live' | 'historical';

export type TimeRangeShiftDirection = 'backward' | 'forward';

/**
 * Live ranges are anchored at "now" (or a relative end in the future, e.g. now+20m).
 * Those keep auto-refresh; everything else is a fixed historical window.
 */
export function getAppTimeRangeMode(raw: { from: string; to: string }): AppTimeRangeMode {
  const to = raw.to.trim().toLowerCase();

  if (to === 'now' || to.startsWith('now+')) {
    return 'live';
  }

  return 'historical';
}

/**
 * Ordered ascending; mirrors the RefreshPicker's default interval options.
 */
const REFRESH_INTERVAL_OPTIONS_MS: ReadonlyArray<{ label: string; ms: number }> = [
  { label: '5s', ms: 5_000 },
  { label: '10s', ms: 10_000 },
  { label: '30s', ms: 30_000 },
  { label: '1m', ms: 60_000 },
  { label: '5m', ms: 300_000 },
  { label: '15m', ms: 900_000 },
  { label: '30m', ms: 1_800_000 },
  { label: '1h', ms: 3_600_000 },
  { label: '2h', ms: 7_200_000 },
  { label: '1d', ms: 86_400_000 },
];

export const DEFAULT_REFRESH_INTERVAL = '1m';

/**
 * Picks a sensible auto-refresh interval for a check dashboard from how often
 * the check runs. We align the refresh cadence with the check frequency so the
 * dashboard reflects new data promptly, snapping to the closest supported
 * interval at or below the frequency so the view never lags more than one
 * check period. Frequencies below the smallest option clamp to it, and an
 * unknown frequency falls back to a safe default.
 */
export function getDefaultRefreshInterval(frequencyMs?: number): string {
  if (!frequencyMs || frequencyMs <= 0) {
    return DEFAULT_REFRESH_INTERVAL;
  }

  let selected = REFRESH_INTERVAL_OPTIONS_MS[0];

  for (const option of REFRESH_INTERVAL_OPTIONS_MS) {
    if (option.ms <= frequencyMs) {
      selected = option;
    } else {
      break;
    }
  }

  return selected.label;
}

export function parseTimeIntervalMs(value: string): number | undefined {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value.trim());

  if (!match) {
    return undefined;
  }

  const amount = Number(match[1]);
  const multipliers = {
    ms: 1,
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return amount * multipliers[match[2] as keyof typeof multipliers];
}

export function resolveTimeRange(from: string, to: string, timezone: string = DEFAULT_APP_TIMEZONE): TimeRange {
  const raw = {
    from,
    to,
  };

  return rangeUtil.convertRawToRange(raw, timezone);
}

export function getShiftedTimeRange(direction: TimeRangeShiftDirection, timeRange: TimeRange): TimeRange {
  const oldTo = timeRange.to.valueOf();
  const oldFrom = timeRange.from.valueOf();
  const halfSpan = (oldTo - oldFrom) / 2;
  const fromRaw = direction === 'backward' ? oldFrom - halfSpan : oldFrom + halfSpan;
  const toRaw = direction === 'backward' ? oldTo - halfSpan : oldTo + halfSpan;
  const from = toUtc(fromRaw);
  const to = toUtc(toRaw);

  return {
    from,
    to,
    raw: { from, to },
  };
}

export function getZoomedTimeRange(timeRange: TimeRange, factor: number): TimeRange {
  const timespan = timeRange.to.valueOf() - timeRange.from.valueOf();
  const center = timeRange.to.valueOf() - timespan / 2;
  const newTimespan = timespan === 0 ? 30_000 : timespan * factor;
  const to = toUtc(center + newTimespan / 2);
  const from = toUtc(center - newTimespan / 2);

  return {
    from,
    to,
    raw: { from, to },
  };
}

export function isValidTimeRange(timeRange: TimeRange): boolean {
  return timeRange.to.isValid() && timeRange.from.isValid();
}

export function canShiftTimeRangeForward(timeRange: TimeRange, nowMs: number = Date.now()): boolean {
  const halfSpanMs = (timeRange.to.valueOf() - timeRange.from.valueOf()) / 2;

  return timeRange.to.valueOf() + halfSpanMs <= nowMs;
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

export function absoluteTimeRangeToRaw(range: { from: number; to: number }) {
  return {
    from: dateTime(range.from).toISOString(),
    to: dateTime(range.to).toISOString(),
  };
}
