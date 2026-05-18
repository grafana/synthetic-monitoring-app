import { buildSingleCheckReachabilitySloQueries } from 'queries/sloPromql';

import { buildReachabilitySloCreateRequest } from './buildReachabilitySloCreateRequest';

describe('buildReachabilitySloCreateRequest', () => {
  it('builds ratio payload with bare metrics and groupByLabels', () => {
    const body = buildReachabilitySloCreateRequest({
      name: 'Test SLO',
      description: 'desc',
      metricsDatasourceUid: 'ds-uid',
      sloQuery: {
        kind: 'ratio',
        successMetric: 'probe_all_success_sum{job="j"}',
        totalMetric: 'probe_all_success_count{job="j"}',
        groupByLabels: ['job', 'instance'],
      },
      labels: [{ key: 'source', value: 'synthetic-monitoring' }],
    });

    expect(body.uuid).toBe('');
    expect(body.query.type).toBe('ratio');
    if (body.query.type === 'ratio') {
      expect(body.query.ratio.successMetric.prometheusMetric).toBe('probe_all_success_sum{job="j"}');
      expect(body.query.ratio.groupByLabels).toEqual(['job', 'instance']);
    }
    expect(body.objectives).toEqual([{ value: 0.995, window: '28d' }]);
  });

  it('uses custom objective when provided', () => {
    const body = buildReachabilitySloCreateRequest({
      name: 'T',
      description: 'd',
      metricsDatasourceUid: 'uid',
      sloQuery: { kind: 'freeform', query: '1' },
      objective: { value: 0.995, window: '7d' },
    });
    expect(body.objectives).toEqual([{ value: 0.995, window: '7d' }]);
  });

  it('builds freeform payload', () => {
    const body = buildReachabilitySloCreateRequest({
      name: 'G',
      description: 'd',
      metricsDatasourceUid: 'uid',
      sloQuery: { kind: 'freeform', query: '(a) / (b)' },
    });
    expect(body.query.type).toBe('freeform');
    if (body.query.type === 'freeform') {
      expect(body.query.freeform.query).toBe('(a) / (b)');
    }
    expect(body.objectives).toEqual([{ value: 0.995, window: '28d' }]);
  });
});

describe('legacy reachability queries still importable for other tests', () => {
  it('buildSingleCheckReachabilitySloQueries works', () => {
    const q = buildSingleCheckReachabilitySloQueries('j', 'https://x');
    expect(q.successQuery).toContain('sum');
  });
});
