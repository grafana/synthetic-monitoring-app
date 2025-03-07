type ProbeHealthQuery = {
  job: string;
  instance: string;
  probe?: string;
};

export function getProbeHealthQuery({ job, instance, probe = `.*` }: ProbeHealthQuery) {
  const expr = `sum by (probe) (count_over_time(probe_success{job="${job}", instance="${instance}", probe=~"${probe}"}[$__range]))`;

  return {
    expr,
    queryType: `instant` as const,
  };
}
