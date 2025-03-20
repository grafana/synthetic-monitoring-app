import React, { useCallback, useMemo } from 'react';
import { matchPath, Outlet, useLocation } from 'react-router-dom-v5-compat';
import { NavModelItem } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';

import { ROUTES } from 'routing/types';
import { getRoute } from 'routing/utils';

function getConfigTabUrl(tab = '/') {
  return `${getRoute(ROUTES.Config)}/${tab}`.replace(/\/+/g, '/');
}

function useActiveTab(route: ROUTES) {
  const fullRoute = getRoute(route);
  const location = useLocation();

  return useCallback(
    (path?: string) => {
      const url = `${fullRoute}/${path ?? ''}`.replace(/\/+/g, '/');
      return Boolean(matchPath(url ?? '', location.pathname));
    },
    [fullRoute, location.pathname]
  );
}

export function ConfigPageLayout() {
  const activeTab = useActiveTab(ROUTES.Config);

  const pageNav: NavModelItem = useMemo(
    () => ({
      icon: 'sliders-v-alt',
      text: 'Config',
      subTitle: 'Configure your Synthetic Monitoring settings',
      url: getConfigTabUrl(),
      hideFromBreadcrumbs: true, // It will stack with the parent breadcrumb ('config')

      children: [
        {
          icon: 'cog',
          text: 'General',
          url: getConfigTabUrl(),
          active: activeTab(''),
        },
        {
          icon: 'key-skeleton-alt',
          text: 'Access tokens',
          url: getConfigTabUrl('access-tokens'),
          active: activeTab('access-tokens'),
        },
        {
          icon: 'brackets-curly',
          text: 'Terraform',
          url: getConfigTabUrl('terraform'),
          active: activeTab('terraform'),
        },
        {
          icon: 'lock',
          text: 'Secrets',
          url: getConfigTabUrl('secrets'),
          active: activeTab('secrets'),
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
