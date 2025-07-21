import { DSQuery } from 'queries/queries.types';

interface SumDurationByProbeQueryProps {
  metric: string;
}

export function getSumDurationByProbeQuery({ metric }: SumDurationByProbeQueryProps): DSQuery {
  return {
    expr: `sum by (probe) (${metric}{probe=~"$probe", job="$job", instance="$instance"})`,
    queryType: 'range',
    legendFormat: '__auto',
  };
}
