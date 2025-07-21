import { DSQuery } from 'queries/queries.types';

interface CountDistinctTargetsQueryProps {
  metric: string;
}

export function getCountDistinctTargetsQuery({ metric }: CountDistinctTargetsQueryProps): DSQuery {
  return {
    expr: `count by (job, target) (count by (url) (${metric}{probe=~"$probe", job="$job", instance="$instance"}))`,
    queryType: 'instant',
    legendFormat: '__auto',
  };
}
