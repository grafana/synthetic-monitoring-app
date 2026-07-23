import { dateTime } from '@grafana/data';

import { createDashboardQuerySemanticValues,createDashboardTimeRange } from './dashboardQueryTime';

describe('dashboard query time', () => {
  it('uses the selected AppTime range by default', () => {
    const range = createDashboardTimeRange({
      absolute: { from: 10, to: 20 },
      raw: { from: 'now-3h', to: 'now' },
    });

    expect(range.from.valueOf()).toBe(10);
    expect(range.to.valueOf()).toBe(20);
    expect(range.raw).toEqual({ from: 'now-3h', to: 'now' });
  });

  it('uses an explicit historical range without retaining relative raw bounds', () => {
    const range = createDashboardTimeRange(
      {
        absolute: { from: 10, to: 20 },
        raw: { from: 'now-3h', to: 'now' },
      },
      { from: 100, to: 200 }
    );

    expect(range.from.valueOf()).toBe(100);
    expect(range.to.valueOf()).toBe(200);
    expect(range.raw).toEqual({ from: dateTime(100), to: dateTime(200) });
  });

  it('derives semantic range values from the explicit bounds', () => {
    const values = createDashboardQuerySemanticValues({
      check: { job: 'health', target: 'https://example.test' },
      probes: ['london'],
      range: { from: 1_000, to: 3_601_000 },
      maxDataPoints: 60,
    });

    expect(values).toMatchObject({
      job: 'health',
      instance: 'https://example.test',
      probes: ['london'],
      rangeSeconds: 3_600,
    });
    expect(values.intervalMs).toBeGreaterThan(0);
    expect(values.rateInterval).toBe(values.interval);
  });

  it('never exposes a zero-second semantic range', () => {
    expect(
      createDashboardQuerySemanticValues({
        check: { job: 'health', target: 'https://example.test' },
        probes: [],
        range: { from: 1_000, to: 1_000 },
        maxDataPoints: 60,
      }).rangeSeconds
    ).toBe(1);
  });
});
