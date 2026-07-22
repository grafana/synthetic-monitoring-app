import { createExecutionCountsDefinition, createReachabilityBreakdownDefinition } from './httpHeaderQueryDefinitions';

describe('HTTP header query definitions', () => {
  it('scopes execution counts to canonical dashboard variables and the selected range', () => {
    const expressions = createExecutionCountsDefinition().targets.map((target) => target.expr).join('\n');

    expect(expressions).toContain('instance="$instance"');
    expect(expressions).toContain('job="$job"');
    expect(expressions).toContain('probe=~"$probe"');
    expect(expressions).toContain('[$__range]');
    expect(expressions).toContain('probe_all_success_count');
    expect(expressions).toContain('probe_all_success_sum');
  });

  it('groups the reachability breakdown by probe', () => {
    const expressions = createReachabilityBreakdownDefinition().targets.map((target) => target.expr).join('\n');

    expect(expressions).toContain('by (probe)');
  });
});
