type UptimeQuery = {
  job: string;
  instance: string;
  probe?: string;
  frequency: number;
};

export function getUptimeQuery({ job, instance, probe = `.*`, frequency }: UptimeQuery) {
  const interval = `${frequency / 1000}s`;

  const expr = `clamp_max(sum(max_over_time(probe_success{job="${job}", instance="${instance}", probe=~"${probe}"}[${interval}])), 1)`;
  const maxDataPoints = 8000; // in theory this could be 11,000 but it seems to error out at certain time ranges? e.g. 21 days for 1m frequency

  return {
    expr,
    maxDataPoints,
    interval,
  };
}
