type UptimeQuery = {
  job: string;
  instance: string;
  probe?: string;
  frequency: number;
};

export function getUptimeQuery({ job, instance, probe = `.*`, frequency }: UptimeQuery) {
  const minStep = `${frequency / 1000}s`;

  const expr = `clamp_max(sum(max_over_time(probe_success{job="${job}", instance="${instance}", probe=~"${probe}"}[${minStep}])), 1)`;
  const maxDataPoints = 10000;
  const interval = `${minStep}`;

  return {
    expr,
    maxDataPoints,
    interval,
  };
}
