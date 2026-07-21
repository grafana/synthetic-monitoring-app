import {
  getDashboardTimeRange,
  getExpectedTimepointCount,
  requireHttpDashboardManifest,
} from '../../../../support/dem-dev/httpDashboardManifest';
import { expect, test } from '../../../../support/dem-dev/fixtures';
import type { ScenarioManifest } from '../../../../support/dem-dev/scenarioManifest';

test('accepts the HTTP dashboard scenario and derives its time contract', () => {
  const manifest = requireHttpDashboardManifest({
    schema_version: 1,
    scenario: 'http-dashboard-parity',
    dsl_version: 1,
    job: 'http-dashboard-parity',
    target: 'https://example.test',
    start: '2026-07-21T12:00:00.000Z',
    end: '2026-07-21T12:03:00.000Z',
    frequency_ms: 60_000,
    probes: {
      'probe-a': {
        executions: 3,
        offset_s: 0,
        status_counts: { '200': 2, '503': 1 },
        reachability: 1,
        latency_p50_ms: 100,
        latency_p95_ms: 200,
      },
      'probe-b': {
        executions: 4,
        offset_s: 10,
        status_counts: { '200': 3, 'failure:timeout': 1 },
        reachability: 0.75,
        latency_p50_ms: 110,
        latency_p95_ms: 220,
      },
      'probe-c': {
        executions: 3,
        offset_s: 20,
        status_counts: { '200': 3 },
        reachability: 1,
        latency_p50_ms: 120,
        latency_p95_ms: 240,
      },
    },
    aggregate: {
      executions: 10,
      reachability: 0.9,
      uptime: 1,
      latency_mean_ms: 150,
      ssl_earliest_cert_expiry: 1_800_000_000,
    },
  });

  expect(getExpectedTimepointCount(manifest)).toBe(4);
  expect(getDashboardTimeRange(manifest, 1)).toEqual({
    from: '2026-07-21T11:59:00.000Z',
    to: '2026-07-21T12:04:00.000Z',
  });
});

test('rejects the legacy scenario at the HTTP dashboard boundary', () => {
  const legacyManifest = {
    scenario: 'http-latency-spike',
    job: 'legacy-http-latency-spike',
    target: 'https://example.test',
    frequency_ms: 60_000,
    probes: {},
    aggregate: { executions: 0, reachability: 0, uptime: 0 },
  } as ScenarioManifest;

  expect(() => requireHttpDashboardManifest(legacyManifest)).toThrow('http-dashboard-parity manifest required');
});
