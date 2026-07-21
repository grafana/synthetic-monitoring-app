import { DashboardQueryTarget, ResolvedQueryRequest } from './types';

export type BuildDatasourceRequestsOptions = {
  targets: DashboardQueryTarget[];
  range: { from: number; to: number };
  timezone: string;
  interval: string;
  intervalMs: number;
  maxDataPoints: number;
  requestId: string;
  defaultDatasource: {
    uid: string;
    type: string;
  };
};

export function buildDatasourceRequests(options: BuildDatasourceRequestsOptions): ResolvedQueryRequest[] {
  const visibleTargets = options.targets.filter((target) => !target.hidden);

  if (visibleTargets.length === 0) {
    return [];
  }

  const grouped = new Map<string, DashboardQueryTarget[]>();

  for (const target of visibleTargets) {
    const uid = target.datasource?.uid ?? options.defaultDatasource.uid;
    const type = target.datasource?.type ?? options.defaultDatasource.type;
    const key = `${type}:${uid}`;
    const current = grouped.get(key) ?? [];
    current.push(target);
    grouped.set(key, current);
  }

  return [...grouped.entries()].map(([key, targets]) => {
    const [datasourceType, datasourceUid] = key.split(':');

    return {
      datasourceUid,
      datasourceType,
      targets,
      range: options.range,
      timezone: options.timezone,
      interval: options.interval,
      intervalMs: options.intervalMs,
      maxDataPoints: options.maxDataPoints,
      requestId: options.requestId,
    };
  });
}
