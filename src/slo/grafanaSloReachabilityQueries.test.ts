import { buildLabelGroupedSloApiFreeformQuery, buildSingleCheckSloApiQuery } from './grafanaSloReachabilityQueries';

describe('buildSingleCheckSloApiQuery', () => {
  it('uses bare counters and ratio kind', () => {
    const spec = buildSingleCheckSloApiQuery('j', 'https://a');
    expect(spec.kind).toBe('ratio');
    if (spec.kind === 'ratio') {
      expect(spec.successMetric).toBe('probe_all_success_sum{job="j",instance="https://a"}');
      expect(spec.totalMetric).toBe('probe_all_success_count{job="j",instance="https://a"}');
      expect(spec.successMetric).not.toContain('rate');
      expect(spec.groupByLabels).toEqual(['job', 'instance']);
    }
  });
});

describe('buildLabelGroupedSloApiFreeformQuery', () => {
  it('uses freeform with sum/rate like the SLO UI', () => {
    const spec = buildLabelGroupedSloApiFreeformQuery({ label_team: 'backend' });
    expect(spec.kind).toBe('freeform');
    if (spec.kind === 'freeform') {
      expect(spec.query).toContain('sum by(instance, job) (rate(probe_all_success_sum[$__rate_interval]))');
      expect(spec.query).toContain('sm_check_info{label_team="backend"}');
    }
  });
});
