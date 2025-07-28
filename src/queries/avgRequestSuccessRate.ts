import { DSQuery } from 'queries/queries.types';

interface AvgRequestSuccessRateQueryProps {
  label: string;
}

export function getAvgRequestSuccessRateQuery({ label }: AvgRequestSuccessRateQueryProps): DSQuery {
  const expr = `
    avg_over_time(
      (
        sum by (${label}, method) (probe_http_requests_failed_total{job="$job", instance="$instance", probe=~"$probe"})
        /
        sum by (${label}, method) (probe_http_requests_total{job="$job", instance="$instance", probe=~"$probe"})
      )[$__range:]
    )
  `;

  return {
    expr,
    queryType: 'instant',
  };
}
