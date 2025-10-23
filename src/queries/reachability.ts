import { DSQueryWithInterval } from 'queries/queries.types';

type ReachabilityQuery = {
  job: string;
  instance: string;
  probe?: string;
  frequency: number;
};

export function getReachabilityQuery({
  job,
  instance,
  probe = `.*`,
  frequency,
}: ReachabilityQuery): DSQueryWithInterval {
  const interval = `${frequency / 1000}s`;

  const expr = `sum(rate(probe_all_success_sum{instance="${instance}", job="${job}", probe=~"${probe}"}[$__rate_interval])) / sum(rate(probe_all_success_count{instance="${instance}", job="${job}", probe=~"${probe}"}[$__rate_interval]))`;

  return {
    expr,
    interval,
    queryType: 'range',
  };
}
