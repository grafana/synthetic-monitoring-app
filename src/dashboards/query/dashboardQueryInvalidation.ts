import { queryClient } from 'data/queryClient';

import { createDashboardQueryScope } from './dashboardQueryKeys';
import { invalidateDashboardScope } from './dashboardQueryOptions';

let activeDashboardScope: ReturnType<typeof createDashboardQueryScope> | null = null;

export function registerActiveDashboardScope(scope: ReturnType<typeof createDashboardQueryScope> | null) {
  activeDashboardScope = scope;
}

export function getActiveDashboardScope() {
  return activeDashboardScope;
}

export function invalidateActiveDashboardQueries() {
  if (!activeDashboardScope) {
    return Promise.resolve();
  }

  return invalidateDashboardScope(queryClient, activeDashboardScope);
}
