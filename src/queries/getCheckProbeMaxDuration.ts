import { DSQuery } from 'queries/queries.types';

type CheckConfigsQuery = {
  job: string;
  instance: string;
  probe?: string;
  frequency: number;
};

export function getCheckProbeMaxDuration({ job, instance, probe = `.*`, frequency }: CheckConfigsQuery): DSQuery {
  const inMS = frequency / 1000;
  const interval = `${inMS}s`;

  return {
    expr: `max by () (max_over_time(probe_duration_seconds{job="${job}", instance="${instance}", probe=~"${probe}"}[${
      inMS * 2
    }s:${interval}]))`,
    queryType: 'range',
    interval,
  };
}
