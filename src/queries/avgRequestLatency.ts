import { DSQuery } from 'queries/queries.types';

interface AvgRequestLatencyQueryProps {
  label: string;
}

export function getAvgRequestLatencyQuery({ label }: AvgRequestLatencyQueryProps): DSQuery {
  const expr = `
    avg_over_time(
      (
        sum by (${label}, method)(probe_http_duration_seconds{job="$job", instance="$instance", probe=~"$probe"})
      )[$__range:]
    )`;

  return {
    expr,
    queryType: 'instant',
  };
}
