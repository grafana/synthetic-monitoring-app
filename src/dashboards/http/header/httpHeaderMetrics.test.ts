import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { CheckAlertType } from 'types';

import { getHttpHeaderMetrics } from './httpHeaderMetrics';

describe('getHttpHeaderMetrics', () => {
  it('returns the agreed telemetry shape without definition-derived frequency', () => {
    const metrics = getHttpHeaderMetrics(BASIC_HTTP_CHECK);

    expect(metrics.map((metric) => metric.id)).toEqual(['uptime', 'reachability', 'average-latency', 'ssl-expiry']);
    expect(metrics.map((metric) => metric.label)).not.toContain('Frequency');
    expect(metrics.every((metric) => metric.secondary === undefined && metric.getSecondaryText === undefined)).toBe(
      true
    );
  });

  it('keeps the headline metrics factual without threshold colour semantics', () => {
    const metrics = getHttpHeaderMetrics(BASIC_HTTP_CHECK);

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

  it('declares each metric comparison capability without changing health capabilities', () => {
    const metrics = getHttpHeaderMetrics(BASIC_HTTP_CHECK);

    expect(
      metrics.map((metric) => ({
        id: metric.id,
        normalBaselineId: metric.comparison?.normalBaseline?.definition.id,
        normalBaselineMaxDataPoints: metric.comparison?.normalBaseline?.definition.maxDataPoints,
        alertTypes: metric.health?.alertTypes,
      }))
    ).toEqual([
      {
        id: 'uptime',
        normalBaselineId: 'http-health-uptime-baseline',
        normalBaselineMaxDataPoints: 720,
        alertTypes: undefined,
      },
      {
        id: 'reachability',
        normalBaselineId: 'http-health-reachability-baseline',
        normalBaselineMaxDataPoints: 720,
        alertTypes: [CheckAlertType.ProbeFailedExecutionsTooHigh],
      },
      {
        id: 'average-latency',
        normalBaselineId: 'http-health-latency-baseline',
        normalBaselineMaxDataPoints: 720,
        alertTypes: [CheckAlertType.HTTPRequestDurationTooHighAvg],
      },
      {
        id: 'ssl-expiry',
        normalBaselineId: undefined,
        normalBaselineMaxDataPoints: undefined,
        alertTypes: [CheckAlertType.TLSTargetCertificateCloseToExpiring],
      },
    ]);
  });
});
