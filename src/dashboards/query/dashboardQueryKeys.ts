import { ResolvedQueryRequest } from './types';

export const DASHBOARD_QUERY_NAMESPACE = 'check-dashboard' as const;

export type DashboardQueryScope = readonly [typeof DASHBOARD_QUERY_NAMESPACE, string, number];

export type DashboardQueryDescriptor = {
  scope: DashboardQueryScope;
  request: ResolvedQueryRequest;
};

function normalizeTargets(targets: ResolvedQueryRequest['targets']) {
  return [...targets]
    .map((target) => ({
      ...target,
      expr: target.expr ?? null,
      query: target.query ?? null,
    }))
    .sort((left, right) => left.refId.localeCompare(right.refId));
}

export function createDashboardQueryScope(stackId: string, checkId: number): DashboardQueryScope {
  return [DASHBOARD_QUERY_NAMESPACE, stackId, checkId];
}

export function buildDashboardQueryKey(descriptor: DashboardQueryDescriptor) {
  const { scope, request } = descriptor;

  return [
    ...scope,
    request.datasourceUid,
    normalizeTargets(request.targets),
    request.range.from,
    request.range.to,
    request.timezone,
    request.interval,
    request.maxDataPoints,
  ] as const;
}

export function dashboardQueryKeyPrefix(scope: DashboardQueryScope) {
  return scope;
}
