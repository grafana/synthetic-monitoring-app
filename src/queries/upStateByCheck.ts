import { DSQuery } from 'queries/queries.types';
import { Check } from 'types';

/**
 * Instant "is each check currently up" state for every check in the stack,
 * grouped by check identity (job + instance) — up when any probe's most
 * recent execution succeeded (the homepage's semantics).
 *
 * Built on last_over_time of the probe_success gauge because it needs only
 * ONE sample per series. A rate-ratio (the previous implementation) hits 0/0
 * (NaN) whenever the window holds samples but no complete execution interval,
 * which intermittently reported healthy low-frequency checks as down between
 * executions. The window only needs to be wide enough to contain each check's
 * most recent sample, so it sizes to the slowest check's frequency.
 */
export function getUpStateByCheckQuery({ checks = [] }: { checks?: Check[] } = {}): DSQuery {
  const maxFrequencySeconds = Math.max(...checks.map((check) => check.frequency), 60_000) / 1000;
  const windowSeconds = Math.max(900, maxFrequencySeconds * 2);
  const expr = `max by (job, instance) (last_over_time(probe_success[${windowSeconds}s]))`;

  return {
    expr,
    queryType: 'instant',
  };
}
