import React, { useCallback, useMemo } from 'react';
import { matchPath, Outlet, useLocation } from 'react-router';
import { NavModelItem } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';

import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';

function getHomeTabUrl(tab = '/') {
  return `${getRoute(AppRoutes.Home)}/${tab}`.replace(/\/+/g, '/');
}

function useActiveTab() {
  const fullRoute = getRoute(AppRoutes.Home);
  const location = useLocation();

  return useCallback(
    (path?: string) => {
      const url = `${fullRoute}/${path ?? ''}`.replace(/\/+/g, '/');
      return Boolean(matchPath(url, location.pathname));
    },
    [fullRoute, location.pathname]
  );
}

export function HomePageLayout() {
  const activeTab = useActiveTab();

  const pageNav: NavModelItem = useMemo(
    () => ({
      text: 'Home',
      hideFromBreadcrumbs: true,
      children: [
        {
          text: 'Insights',
          url: getHomeTabUrl(),
          active: activeTab(''),
        },
        {
          text: 'Summary',
          url: getHomeTabUrl('dashboard'),
          active: activeTab('dashboard'),
        },
      ],
    }),
    [activeTab]
  );

  return (
    <PluginPage pageNav={pageNav}>
      <Outlet />
    </PluginPage>
  );
}
