import { useCallback } from 'react';
import { matchPath, useLocation } from 'react-router';

import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';

/**
 * Builds the URL for a tab nested under `route`, e.g. `useTabUrl(AppRoutes.Config)('terraform')`.
 * An empty path yields the index tab.
 */
export function useTabUrl(route: AppRoutes) {
  const fullRoute = getRoute(route);

  return useCallback((tab = '') => `${fullRoute}/${tab}`.replace(/\/+/g, '/'), [fullRoute]);
}

/**
 * Returns a predicate telling you whether a tab nested under `route` is the one currently
 * being displayed, for the `active` flag on a `NavModelItem`.
 */
export function useActiveTab(route: AppRoutes) {
  const getTabUrl = useTabUrl(route);
  const location = useLocation();

  return useCallback((tab = '') => Boolean(matchPath(getTabUrl(tab), location.pathname)), [getTabUrl, location.pathname]);
}
