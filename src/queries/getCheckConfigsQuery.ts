import { DSQuery } from 'queries/queries.types';

type CheckConfigsQuery = {
  job: string;
  instance: string;
  probe?: string;
};

export function getCheckConfigsQuery({ job, instance, probe = `.*` }: CheckConfigsQuery): DSQuery {
  return {
    expr: `group by(frequency, config_version) (max_over_time(sm_check_info{job="${job}", instance="${instance}", probe=~"${probe}"}[$__range]))`,
    queryType: 'instant',
  } as const;
}
