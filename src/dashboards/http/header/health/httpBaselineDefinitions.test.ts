import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import {
  createLatencyBaselineDefinition,
  createReachabilityBaselineDefinition,
  createUptimeBaselineDefinition,
} from './httpBaselineDefinitions';

describe('HTTP baseline definitions', () => {
  it.each([
    ['uptime', createUptimeBaselineDefinition(BASIC_HTTP_CHECK)],
    ['reachability', createReachabilityBaselineDefinition()],
    ['latency', createLatencyBaselineDefinition()],
  ])('returns an hourly %s series without reducing it', (_metric, definition) => {
    expect(definition.maxDataPoints).toBe(720);
    expect(definition.transforms).toBeUndefined();
    expect(definition.targets).toHaveLength(1);
    expect(definition.targets[0]).toMatchObject({
      interval: '1h',
      range: true,
    });
  });

  it('uses the check frequency to establish each uptime execution', () => {
    expect(createUptimeBaselineDefinition(BASIC_HTTP_CHECK).targets[0].expr).toContain(
      `[${BASIC_HTTP_CHECK.frequency / 1000}s]`
    );
  });

  it('uses one-hour windows for reachability and latency', () => {
    expect(createReachabilityBaselineDefinition().targets[0].expr).toContain('[1h]');
    expect(createLatencyBaselineDefinition().targets[0].expr).toContain('[1h]');
  });

  it('keeps baseline query identities separate from selected-range metric identities', () => {
    expect([
      createUptimeBaselineDefinition(BASIC_HTTP_CHECK).id,
      createReachabilityBaselineDefinition().id,
      createLatencyBaselineDefinition().id,
    ]).toEqual([
      'http-health-uptime-baseline',
      'http-health-reachability-baseline',
      'http-health-latency-baseline',
    ]);
  });
});
