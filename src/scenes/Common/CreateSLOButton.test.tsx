import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import {
  buildSLODescription,
  buildSLOLabels,
  buildSLOName,
  buildSLOQuery,
  buildSLOWizardInitialValuesForCheck,
} from './CreateSLOButton.utils';

describe('CreateSLOButton utils', () => {
  it('builds labels with sm_check_id and source', () => {
    expect(buildSLOLabels(BASIC_HTTP_CHECK)).toEqual([
      { key: 'sm_check_id', value: String(BASIC_HTTP_CHECK.id) },
      { key: 'source', value: 'grafana-synthetic-monitoring-app' },
    ]);
  });

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
      'Reachability SLI from Synthetic Monitoring. Job: Job name for http | Instance: https://http.com'
    );
  });

  describe('buildSLOWizardInitialValuesForCheck', () => {
    it('prefills reachability values and labels when there are no linked SLOs', () => {
      const result = buildSLOWizardInitialValuesForCheck(BASIC_HTTP_CHECK, []);

      expect(result).toEqual({
        name: buildSLOName(BASIC_HTTP_CHECK),
        description: buildSLODescription(BASIC_HTTP_CHECK),
        query: buildSLOQuery(BASIC_HTTP_CHECK),
        labels: [
          { key: 'sm_check_id', value: String(BASIC_HTTP_CHECK.id) },
          { key: 'sm_objective_kind', value: 'reachability' },
          { key: 'source', value: 'grafana-synthetic-monitoring-app' },
        ],
      });
    });

    it('only prefills check label when linked SLOs already contain reachability objective label', () => {
      const result = buildSLOWizardInitialValuesForCheck(BASIC_HTTP_CHECK, [
        {
          labels: [
            { key: 'sm_check_id', value: String(BASIC_HTTP_CHECK.id) },
            { key: 'sm_objective_kind', value: 'reachability' },
          ],
        },
      ]);

      expect(result).toEqual({
        labels: [{ key: 'sm_check_id', value: String(BASIC_HTTP_CHECK.id) }],
      });
    });

    it('prefills reachability values when linked SLOs do not include reachability objective label', () => {
      const result = buildSLOWizardInitialValuesForCheck(BASIC_HTTP_CHECK, [
        {
          labels: [{ key: 'sm_check_id', value: String(BASIC_HTTP_CHECK.id) }],
        },
      ]);

      expect(result).toEqual({
        name: buildSLOName(BASIC_HTTP_CHECK),
        description: buildSLODescription(BASIC_HTTP_CHECK),
        query: buildSLOQuery(BASIC_HTTP_CHECK),
        labels: [
          { key: 'sm_check_id', value: String(BASIC_HTTP_CHECK.id) },
          { key: 'sm_objective_kind', value: 'reachability' },
          { key: 'source', value: 'grafana-synthetic-monitoring-app' },
        ],
      });
    });
  });
});
