import { DEFAULT_QUERY_FROM_TIME } from 'components/constants';

export function getProbeExecutionRateQuery() {
  return `sum(rate(probe_all_success_count[${DEFAULT_QUERY_FROM_TIME}])) by (probe)`;
}

export function getProbeFailureRateQuery() {
  return `clamp_min(sum(rate(probe_all_success_count[${DEFAULT_QUERY_FROM_TIME}])) by (probe) - sum(rate(probe_all_success_sum[${DEFAULT_QUERY_FROM_TIME}])) by (probe), 0)`;
}
