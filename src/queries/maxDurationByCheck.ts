type AvgDurationByCheckQuery = {
  job: string;
  instance: string;
  probe?: string;
};

export function getMaxDurationByCheck({ job, instance, probe = `.*` }: AvgDurationByCheckQuery) {
  const expr = `max(max_over_time(probe_duration_seconds{job="${job}", instance="${instance}", probe=~"${probe}"}[$__range]))`;

  return {
    expr,
    queryType: `instant` as const,
  };
}
