import { joinRegexValues } from 'queries/queries.utils';

import { DSQueryWithInterval } from 'queries/queries.types';
import { Check } from 'types';

// The query goes out as a GET, so an inlined matcher list can hit URL length
// limits on large folders. Past this budget, fall back to the unscoped
// expression — heavier on the backend, but it keeps working where the scoped
// one physically can't be sent.
const MAX_SELECTOR_LENGTH = 2000;

/**
 * Average execution duration as a range vector, grouped by check identity
 * (job + instance), suitable for trend sparklines.
 *
 * Scoped to the given checks with job/instance matchers so the range query
 * doesn't sweep the whole stack (which can hold thousands of checks) —
 * except for very large folders, where the matchers won't fit in the request
 * (see MAX_SELECTOR_LENGTH). The regex matchers can over-match a
 * job × instance cross-product, so consumers must still pair the results by
 * exact (job, instance) key.
 *
 * A rate window needs at least two samples of a series inside it. Sizing it
 * to 3x the slowest check's frequency keeps that true even with execution
 * jitter (2x is marginal: a window can catch a single sample and go empty).
 * The step stays fixed — a dense evaluation grid costs little and means young
 * checks produce points as soon as they have two samples.
 */
export function getLatencyTrendByCheckQuery({ checks }: { checks: Check[] }): DSQueryWithInterval {
  const maxFrequencySeconds = Math.max(...checks.map((check) => check.frequency), 60_000) / 1000;
  const windowSeconds = Math.max(600, maxFrequencySeconds * 3);
  const stepSeconds = 300;

  const scopedSelector = `{job=~"${joinRegexValues(checks.map((check) => check.job))}", instance=~"${joinRegexValues(
    checks.map((check) => check.target)
  )}"}`;
  const selector = scopedSelector.length <= MAX_SELECTOR_LENGTH ? scopedSelector : '';

  const expr = `sum(rate(probe_all_duration_seconds_sum${selector}[${windowSeconds}s]) or rate(probe_duration_seconds_sum${selector}[${windowSeconds}s])) by (job, instance)
  /
  sum(rate(probe_all_duration_seconds_count${selector}[${windowSeconds}s]) or rate(probe_duration_seconds_count${selector}[${windowSeconds}s])) by (job, instance)`;

  return {
    expr,
    interval: `${stepSeconds}s`,
    queryType: 'range',
  };
}
