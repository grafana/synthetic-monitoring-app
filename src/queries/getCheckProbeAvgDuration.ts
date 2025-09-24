import { DSQuery } from 'queries/queries.types';

type CheckConfigsQuery = {
  job: string;
  instance: string;
};

export function getCheckProbeAvgDuration({ job, instance }: CheckConfigsQuery): DSQuery {
  return {
    expr: `avg by() (probe_duration_seconds{job="${job}", instance="${instance}"})`,
    queryType: 'instant',
  };
}
