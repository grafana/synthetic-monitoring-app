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
 * executions.
 *
 * The window is a balance: it must contain every ACTIVE probe's latest sample
 * (≥1 execution interval plus jitter), but no wider — a probe that stops
 * reporting keeps contributing its final sample for the window's length, and
 * a stale success could mask other probes' live failures. At 1.5x the slowest
 * frequency, a silent probe drops out after roughly one missed cycle.
 */
export function getUpStateByCheckQuery({ checks = [] }: { checks?: Check[] } = {}): DSQuery {
  const maxFrequencySeconds = Math.max(...checks.map((check) => check.frequency), 60_000) / 1000;
  const windowSeconds = Math.max(300, Math.round(maxFrequencySeconds * 1.5));
  const expr = `max by (job, instance) (last_over_time(probe_success[${windowSeconds}s]))`;

  return {
    expr,
    queryType: 'instant',
  };
}
