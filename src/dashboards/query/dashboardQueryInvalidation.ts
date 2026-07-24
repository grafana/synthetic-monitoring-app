import { queryClient } from 'data/queryClient';

import { createDashboardQueryScope } from './dashboardQueryKeys';
import { invalidateDashboardScope } from './dashboardQueryOptions';

type DashboardQueryScope = ReturnType<typeof createDashboardQueryScope>;

const activeDashboardScopes = new Map<symbol, DashboardQueryScope>();

export function registerActiveDashboardScope(scope: DashboardQueryScope) {
  const token = Symbol('active-dashboard-scope');
  activeDashboardScopes.set(token, scope);

  return () => {
    activeDashboardScopes.delete(token);
  };
}

export function getActiveDashboardScope() {
  return Array.from(activeDashboardScopes.values()).at(-1) ?? null;
}

export function invalidateActiveDashboardQueries() {
  const activeDashboardScope = getActiveDashboardScope();

  if (!activeDashboardScope) {
    return Promise.resolve();
  }

  return invalidateDashboardScope(queryClient, activeDashboardScope);
}
