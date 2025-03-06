type ProbeSuccessQuery = {
  job: string;
  instance: string;
  probe?: string;
  frequency: number;
};

export function getProbeSuccessQuery({ job, instance, probe = `.*`, frequency }: ProbeSuccessQuery) {
  const interval = `${frequency / 1000}s`;

  const expr = `sum by (probe) (probe_success{job="${job}", instance="${instance}", probe=~"${probe}"})`;
  const maxDataPoints = 8000; // in theory this could be 11,000 but it seems to error out at certain time ranges? e.g. 21 days for 1m frequency

  return {
    expr,
    maxDataPoints,
    interval,
  };
}
