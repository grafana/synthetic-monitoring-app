import { DSQuery } from 'queries/queries.types';

type CheckConfigsQuery = {
  job: string;
  instance: string;
  probe?: string;
};

export function getCheckConfigsQuery({ job, instance, probe = `.*` }: CheckConfigsQuery): DSQuery {
  return {
    expr: `count by(frequency, config_version) (sm_check_info{job="${job}", instance="${instance}", probe=~"${probe}"})`,
    queryType: 'range',
  } as const;
}
