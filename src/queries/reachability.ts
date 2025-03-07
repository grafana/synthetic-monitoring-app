type UptimeQuery = {
  job: string;
  instance: string;
  probe?: string;
  frequency: number;
};

export function getReachabilityQuery({ job, instance, probe = `.*`, frequency }: UptimeQuery) {
  const interval = `${frequency / 1000}s`;

  const expr = `sum(rate(probe_all_success_sum{job="${job}", instance="${instance}", probe=~"${probe}"}[$__rate_interval])) / sum(rate(probe_all_success_count{job="${job}", instance="${instance}", probe=~"${probe}"}[$__rate_interval]))`;
  const maxDataPoints = 8000; // in theory this could be 11,000 but it seems to error out at certain time ranges? e.g. 21 days for 1m frequency

  return {
    expr,
    maxDataPoints,
    interval,
  };
}
