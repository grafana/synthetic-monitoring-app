import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { CheckAlertType } from 'types';

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

  it('wires a range sparkline definition for each headline metric', () => {
    const metrics = getHttpHeaderMetrics(BASIC_HTTP_CHECK);

    expect(
      metrics.map((metric) => ({
        id: metric.id,
        sparklineId: metric.sparkline?.definition.id,
        hasReduce: Boolean(metric.sparkline?.definition.transforms?.some((transform) => transform.id === 'reduce')),
        range: metric.sparkline?.definition.targets.every((target) => target.range !== false && !target.instant),
      }))
    ).toEqual([
      { id: 'uptime', sparklineId: 'http-uptime-sparkline', hasReduce: false, range: true },
      { id: 'reachability', sparklineId: 'http-reachability-sparkline', hasReduce: false, range: true },
      { id: 'average-latency', sparklineId: 'http-average-latency-sparkline', hasReduce: false, range: true },
      { id: 'ssl-expiry', sparklineId: 'http-ssl-expiry', hasReduce: false, range: true },
    ]);

    const latencySparkline = metrics.find((metric) => metric.id === 'average-latency')?.sparkline;
    expect(latencySparkline?.definition.targets[0]?.interval).toBe(`${BASIC_HTTP_CHECK.frequency / 1000}s`);
  });

  it('declares the alert capabilities associated with each metric', () => {
    const metrics = getHttpHeaderMetrics(BASIC_HTTP_CHECK);

    expect(
      metrics.map((metric) => ({
        id: metric.id,
        alertTypes: metric.health?.alertTypes,
      }))
    ).toEqual([
      { id: 'uptime', alertTypes: undefined },
      { id: 'reachability', alertTypes: [CheckAlertType.ProbeFailedExecutionsTooHigh] },
      { id: 'average-latency', alertTypes: [CheckAlertType.HTTPRequestDurationTooHighAvg] },
      { id: 'ssl-expiry', alertTypes: [CheckAlertType.TLSTargetCertificateCloseToExpiring] },
    ]);
  });
});
