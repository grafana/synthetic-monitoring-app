import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { getHttpHeaderMetrics } from './httpHeaderMetrics';

describe('getHttpHeaderMetrics', () => {
  it('returns the agreed telemetry shape without definition-derived frequency', () => {
    const metrics = getHttpHeaderMetrics(BASIC_HTTP_CHECK);

    expect(metrics.map((metric) => metric.id)).toEqual(['uptime', 'reachability', 'average-latency', 'ssl-expiry']);
    expect(metrics.map((metric) => metric.label)).not.toContain('Frequency');
    expect(metrics.find((metric) => metric.id === 'reachability')?.secondary?.definition.id).toBe(
      'http-header-execution-counts'
    );
  });

  it('keeps the headline metrics factual without threshold colour semantics', () => {
    const metrics = getHttpHeaderMetrics(BASIC_HTTP_CHECK);
    const uptime = metrics.find((metric) => metric.id === 'uptime');

    expect(uptime?.getSecondaryText?.(0.4324)).toBe('From at least one location');
    expect(metrics.every((metric) => !('getColor' in metric))).toBe(true);
  });
});
