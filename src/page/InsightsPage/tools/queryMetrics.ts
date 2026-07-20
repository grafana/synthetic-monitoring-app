import { createTool } from '@grafana/assistant';

import { queryInstantMetric } from 'data/utils';

interface QueryMetricsInput {
  query: string;
}

export function createQueryMetricsTool(metricsUrl: string) {
  return createTool<QueryMetricsInput>(
    async (input) => {
      const now = Math.floor(Date.now() / 1000);
      const sevenDaysAgo = now - 7 * 24 * 60 * 60;

      try {
        const results = await queryInstantMetric({
          url: metricsUrl,
          query: input.query,
          start: sevenDaysAgo,
          end: now,
        });

        if (results.length === 0) {
          return 'No data returned for this query.';
        }

        const formatted = results.map((r) => {
          const labels = Object.entries(r.metric)
            .filter(([k]) => k !== '__name__')
            .map(([k, v]) => `${k}="${v}"`)
            .join(', ');
          return `{${labels}}: ${r.value[1]}`;
        }).join('\n');

        return formatted;
      } catch (error) {
        return `Query failed: ${error instanceof Error ? error.message : 'unknown error'}`;
      }
    },
    {
      name: 'query_sm_metrics',
      description: `Query Synthetic Monitoring Prometheus metrics. Use this to get real-time metric values for checks and probes.

Checks are identified by job + instance labels. Always include both in the selector.

Useful queries:
- Per-probe success rate: avg by (probe) (rate(probe_all_success_sum{job="JOB", instance="INSTANCE"}[7d]) / rate(probe_all_success_count{job="JOB", instance="INSTANCE"}[7d]))
- Overall success rate: sum(rate(probe_all_success_sum{job="JOB", instance="INSTANCE"}[7d])) / sum(rate(probe_all_success_count{job="JOB", instance="INSTANCE"}[7d]))
- P95 latency per probe: histogram_quantile(0.95, sum by(probe, le)(rate(probe_all_duration_seconds_bucket{job="JOB", instance="INSTANCE"}[7d]))) * 1000
- Flapping per probe: sum by (probe) (changes(probe_success{job="JOB", instance="INSTANCE"}[7d]))

Replace JOB with the check's job name and INSTANCE with the check's target. Both are available in the insights data under checks[id].job and checks[id].target.`,
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The PromQL query to execute against the Synthetic Monitoring metrics datasource',
          },
        },
        required: ['query'],
      },
      validate: (input) => {
        if (typeof input.query !== 'string' || input.query.trim() === '') {
          throw new Error('query must be a non-empty string');
        }
        return { query: input.query };
      },
    }
  );
}
