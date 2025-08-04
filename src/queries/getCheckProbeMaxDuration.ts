import { DSQuery } from 'queries/queries.types';

type CheckConfigsQuery = {
  job: string;
  instance: string;
  probe?: string;
};

export function getCheckProbeMaxDuration({ job, instance, probe = `.*` }: CheckConfigsQuery): DSQuery {
  return {
    expr: `max by () (max_over_time(probe_duration_seconds{job="${job}", instance="${instance}", probe=~"${probe}"}[$__range]))`,
    queryType: 'instant',
  };
}
