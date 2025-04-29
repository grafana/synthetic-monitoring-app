import { DSQuery } from 'queries/queries.types';

type CheckConfigsQuery = {
  job: string;
  instance: string;
};

export function getCheckProbeMaxDuration({ job, instance }: CheckConfigsQuery): DSQuery {
  return {
    expr: `max by() (probe_duration_seconds{job="${job}", instance="${instance}"})`,
    queryType: 'instant',
  };
}
