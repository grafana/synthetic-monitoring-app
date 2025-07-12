import { DSQuery } from 'queries/queries.types';

type CheckConfigsQuery = {
  job: string;
  instance: string;
};

export function getCheckConfigsQuery({ job, instance }: CheckConfigsQuery): DSQuery {
  return {
    expr: `count by(frequency, config_version) (sm_check_info{job="${job}", instance="${instance}"})`,
    queryType: 'range',
  };
}
