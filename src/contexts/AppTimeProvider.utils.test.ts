import { dateTime, toUtc } from '@grafana/data';

import {
  absoluteTimeRangeToRaw,
  canShiftTimeRangeForward,
  getAppTimeRangeMode,
  getShiftedTimeRange,
  getZoomedTimeRange,
  isValidTimeRange,
  parseTimeIntervalMs,
  resolveTimeRange,
} from './AppTimeProvider.utils';

function absoluteRange(fromIso: string, toIso: string) {
  const from = toUtc(fromIso);
  const to = toUtc(toIso);

  return { from, to, raw: { from, to } };
}

describe('absoluteTimeRangeToRaw', () => {
  it('converts epoch milliseconds to ISO strings', () => {
    const from = Date.parse('2020-01-01T00:00:00.000Z');
    const to = Date.parse('2020-01-02T00:00:00.000Z');

    expect(absoluteTimeRangeToRaw({ from, to })).toEqual({
      from: dateTime(from).toISOString(),
      to: dateTime(to).toISOString(),
    });
  });
});

describe('getShiftedTimeRange', () => {
  it('shifts backward by half the current span', () => {
    const range = absoluteRange('2020-01-01T04:00:00.000Z', '2020-01-01T08:00:00.000Z');
    const shifted = getShiftedTimeRange('backward', range);

    expect(shifted.from.valueOf()).toBe(Date.parse('2020-01-01T02:00:00.000Z'));
    expect(shifted.to.valueOf()).toBe(Date.parse('2020-01-01T06:00:00.000Z'));
  });

  it('shifts forward by half the current span', () => {
    const range = absoluteRange('2020-01-01T04:00:00.000Z', '2020-01-01T08:00:00.000Z');
    const shifted = getShiftedTimeRange('forward', range);

    expect(shifted.from.valueOf()).toBe(Date.parse('2020-01-01T06:00:00.000Z'));
    expect(shifted.to.valueOf()).toBe(Date.parse('2020-01-01T10:00:00.000Z'));
  });
});

describe('getZoomedTimeRange', () => {
  it('zooms out by the given factor around the center', () => {
    const range = absoluteRange('2020-01-01T04:00:00.000Z', '2020-01-01T08:00:00.000Z');
    const zoomed = getZoomedTimeRange(range, 2);

    expect(zoomed.from.valueOf()).toBe(Date.parse('2020-01-01T02:00:00.000Z'));
    expect(zoomed.to.valueOf()).toBe(Date.parse('2020-01-01T10:00:00.000Z'));
  });

  it('uses a 30s fallback span when the range has zero width', () => {
    const range = absoluteRange('2020-01-01T04:00:00.000Z', '2020-01-01T04:00:00.000Z');
    const zoomed = getZoomedTimeRange(range, 2);

    expect(zoomed.to.valueOf() - zoomed.from.valueOf()).toBe(30_000);
  });
});

describe('isValidTimeRange', () => {
  it('returns true for valid ranges', () => {
    expect(isValidTimeRange(absoluteRange('2020-01-01T00:00:00.000Z', '2020-01-01T01:00:00.000Z'))).toBe(true);
  });
});

describe('canShiftTimeRangeForward', () => {
  it('is false when a forward shift would go past now', () => {
    const now = Date.parse('2020-01-01T12:00:00.000Z');
    const range = absoluteRange('2020-01-01T10:00:00.000Z', '2020-01-01T12:00:00.000Z');

    expect(canShiftTimeRangeForward(range, now)).toBe(false);
  });

  it('is true when a forward shift stays at or before now', () => {
    const now = Date.parse('2020-01-01T14:00:00.000Z');
    const range = absoluteRange('2020-01-01T10:00:00.000Z', '2020-01-01T12:00:00.000Z');

    expect(canShiftTimeRangeForward(range, now)).toBe(true);
  });
});

describe('resolveTimeRange', () => {
  it('resolves relative ranges using the provided timezone', () => {
    const range = resolveTimeRange('now-1h', 'now', 'utc');

    expect(range.from.isValid()).toBe(true);
    expect(range.to.isValid()).toBe(true);
    expect(range.raw).toEqual({ from: 'now-1h', to: 'now' });
  });
});

describe('getAppTimeRangeMode', () => {
  it.each([
    [{ from: 'now-3h', to: 'now' }, 'live'],
    [{ from: 'now-3h', to: 'now+20m' }, 'live'],
    [{ from: '2026-07-23T08:00:00.000Z', to: 'now' }, 'live'],
    [{ from: '2026-07-23T08:00:00.000Z', to: '2026-07-23T11:00:00.000Z' }, 'historical'],
    [{ from: 'now-3h', to: 'now-5m' }, 'historical'],
  ] as const)('classifies %o as %s', (raw, expected) => {
    expect(getAppTimeRangeMode(raw)).toBe(expected);
  });
});

describe('parseTimeIntervalMs', () => {
  it.each([
    ['30s', 30_000],
    ['5m', 300_000],
    ['2h', 7_200_000],
    ['1d', 86_400_000],
  ])('parses %s', (value, expected) => {
    expect(parseTimeIntervalMs(value)).toBe(expected);
  });

  it('rejects unsupported values', () => {
    expect(parseTimeIntervalMs('weekly')).toBeUndefined();
  });
});
