import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { buildSLODescription, buildSLOName, buildSLOQuery } from './CreateSLOButton.utils';

describe('CreateSLOButton utils', () => {
  it('builds ratio query for the check', () => {
    const result = buildSLOQuery(BASIC_HTTP_CHECK);

    expect(result).toEqual({
      type: 'ratio',
      ratioQuery: {
        successMetric: 'probe_all_success_sum{instance="https://http.com", job="Job name for http"}',
        totalMetric: 'probe_all_success_count{instance="https://http.com", job="Job name for http"}',
        groupByLabels: 'job,instance',
      },
    });
  });

  it('builds the expected default name', () => {
    expect(buildSLOName(BASIC_HTTP_CHECK)).toBe('Job name for http (Reachability)');
  });

  it('builds the expected default description', () => {
    expect(buildSLODescription(BASIC_HTTP_CHECK)).toBe(
      'Reachability SLI from Synthetic Monitoring (probe_all_success_*). Check: Job name for http'
    );
  });
});
