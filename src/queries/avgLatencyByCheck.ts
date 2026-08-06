import { DSQuery } from 'queries/queries.types';

/**
 * Average execution duration over the window for every check in the stack,
 * grouped by check identity (job + instance). k6-based checks (scripted,
 * browser, multihttp) emit probe_duration_seconds_* instead of
 * probe_all_duration_seconds_* — union both, like the check list does.
 */
export function getAvgLatencyByCheckQuery({ window }: { window: string }): DSQuery {
  const expr = `sum(rate(probe_all_duration_seconds_sum[${window}]) or rate(probe_duration_seconds_sum[${window}])) by (job, instance)
  /
  sum(rate(probe_all_duration_seconds_count[${window}]) or rate(probe_duration_seconds_count[${window}])) by (job, instance)`;

  return {
    expr,
    queryType: 'instant',
  };
}
