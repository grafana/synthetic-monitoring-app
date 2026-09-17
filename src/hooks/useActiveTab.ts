import { useCallback } from 'react';
import { matchPath, useLocation } from 'react-router';

import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';

// `useTabUrl(AppRoutes.Config)('terraform')`; an empty tab is the index.
export function useTabUrl(route: AppRoutes) {
  const fullRoute = getRoute(route);

  return useCallback((tab = '') => `${fullRoute}/${tab}`.replace(/\/+/g, '/'), [fullRoute]);
}

export function useActiveTab(route: AppRoutes) {
  const getTabUrl = useTabUrl(route);
  const location = useLocation();

  return useCallback(
    (tab = '') => Boolean(matchPath(getTabUrl(tab), location.pathname)),
    [getTabUrl, location.pathname]
  );
}
