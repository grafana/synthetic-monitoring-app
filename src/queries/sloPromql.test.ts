import {
  buildSingleCheckReachabilitySloQueries,
  buildSmCheckInfoFilteredReachabilitySloAggregatedQueries,
  buildSmCheckInfoFilteredReachabilitySloRatio,
  checkLabelNameToSmCheckInfoKey,
  escapePrometheusLabelValue,
  smCheckInfoMatchersFromCheckLabels,
} from './sloPromql';

describe('escapePrometheusLabelValue', () => {
  it('escapes backslashes, newlines, and double quotes', () => {
    expect(escapePrometheusLabelValue('a\\b')).toBe('a\\\\b');
    expect(escapePrometheusLabelValue('a\nb')).toBe('a\\nb');
    expect(escapePrometheusLabelValue('a"b')).toBe('a\\"b');
  });
});

describe('checkLabelNameToSmCheckInfoKey', () => {
  it('prefixes label_ when missing', () => {
    expect(checkLabelNameToSmCheckInfoKey('team')).toBe('label_team');
  });

  it('does not double-prefix', () => {
    expect(checkLabelNameToSmCheckInfoKey('label_team')).toBe('label_team');
  });
});

describe('buildSingleCheckReachabilitySloQueries', () => {
  it('builds ratio and split queries for job and instance', () => {
    const q = buildSingleCheckReachabilitySloQueries('my-job', 'https://example.com');
    expect(q.successQuery).toBe(
      'sum(rate(probe_all_success_sum{job="my-job",instance="https://example.com"}[$__rate_interval]))'
    );
    expect(q.totalQuery).toBe(
      'sum(rate(probe_all_success_count{job="my-job",instance="https://example.com"}[$__rate_interval]))'
    );
    expect(q.ratio).toBe(`(${q.successQuery}) / (${q.totalQuery})`);
  });

  it('escapes special characters in labels', () => {
    const q = buildSingleCheckReachabilitySloQueries('j"ob', 'https://ex.com/path"');
    expect(q.successQuery).toContain('job="j\\"ob"');
    expect(q.successQuery).toContain('instance="https://ex.com/path\\""');
  });
});

describe('buildSmCheckInfoFilteredReachabilitySloRatio', () => {
  it('matches backend team filter pattern', () => {
    const expr = buildSmCheckInfoFilteredReachabilitySloRatio({ label_team: 'backend' });
    expect(expr).toContain('sm_check_info{label_team="backend"}');
    expect(expr).toContain('group_left(check_name, label_team)');
    expect(expr).toContain('max by(instance, job, check_name, label_team)');
    expect(expr).toContain('sum by(instance, job) (rate(probe_all_success_sum[$__rate_interval]))');
  });

  it('sorts matcher keys for stable max by / group_left', () => {
    const expr = buildSmCheckInfoFilteredReachabilitySloRatio({ z: '1', a: '2' });
    expect(expr).toContain('max by(instance, job, check_name, a, z)');
    expect(expr).toContain('group_left(check_name, a, z)');
  });

  it('throws when matchers empty', () => {
    expect(() => buildSmCheckInfoFilteredReachabilitySloRatio({})).toThrow(
      'At least one sm_check_info matcher is required'
    );
  });
});

describe('buildSmCheckInfoFilteredReachabilitySloAggregatedQueries', () => {
  it('wraps per-check join vectors in sum for one group-level SLI', () => {
    const q = buildSmCheckInfoFilteredReachabilitySloAggregatedQueries({ label_team: 'backend' });
    expect(q.successQuery).toContain('sum(\n');
    expect(q.successQuery).toContain('probe_all_success_sum');
    expect(q.totalQuery).toContain('probe_all_success_count');
    expect(q.ratio).toBe(`(${q.successQuery}) / (${q.totalQuery})`);
    expect(q.successQuery).toContain('sm_check_info{label_team="backend"}');
  });
});

describe('smCheckInfoMatchersFromCheckLabels', () => {
  it('maps check labels to sm_check_info keys', () => {
    expect(smCheckInfoMatchersFromCheckLabels([{ name: 'team', value: 'backend' }])).toEqual({
      label_team: 'backend',
    });
  });
});
