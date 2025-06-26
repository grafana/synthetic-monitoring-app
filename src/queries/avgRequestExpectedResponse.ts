import { DSQuery } from 'queries/queries.types';

interface AvgRequestExpectedResponseQueryProps {
  label: string;
}

export function getAvgRequestExpectedResponseQuery({ label }: AvgRequestExpectedResponseQueryProps): DSQuery {
  const expr = `
    avg_over_time(
      (
        sum by (${label}, method) (probe_http_got_expected_response{job="$job", instance="$instance", probe=~"$probe"})
        /
        count by (${label}, method)(probe_http_got_expected_response{job="$job", instance="$instance", probe=~"$probe"})
      )[$__range:]
    )
  `;

  return {
    expr,
    queryType: 'instant',
  };
}
