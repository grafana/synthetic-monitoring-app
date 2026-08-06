import { DSQuery } from 'queries/queries.types';

/**
 * Instant "is each check currently up" state for every check in the stack,
 * grouped by check identity (job + instance) — mirrors the state query the
 * summary table uses. The window is deliberately wider than most check
 * frequencies so low-frequency checks still report a state.
 */
export function getUpStateByCheckQuery({ window = '15m' }: { window?: string } = {}): DSQuery {
  const expr = `ceil(
  sum(rate(probe_all_success_sum[${window}])) by (job, instance)
  /
  sum(rate(probe_all_success_count[${window}])) by (job, instance)
)`;

  return {
    expr,
    queryType: 'instant',
  };
}
