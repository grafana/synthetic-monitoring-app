import { DEFAULT_QUERY_FROM_TIME } from 'components/constants';

// Window for "is this check passing right now". Needs to cover at least two samples
// of the slowest common check frequencies, otherwise rate() returns nothing.
export const CURRENT_STATE_WINDOW = '10m';

export function getChecksCurrentSuccessRateQuery() {
  return `sum by (job, instance) (rate(probe_all_success_sum[${CURRENT_STATE_WINDOW}])) / sum by (job, instance) (rate(probe_all_success_count[${CURRENT_STATE_WINDOW}]))`;
}

export function getOverallReachabilityQuery() {
  return `sum(rate(probe_all_success_sum[${DEFAULT_QUERY_FROM_TIME}])) / sum(rate(probe_all_success_count[${DEFAULT_QUERY_FROM_TIME}]))`;
}
