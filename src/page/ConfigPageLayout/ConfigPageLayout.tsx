import React, { useCallback, useMemo } from 'react';
import { matchPath, Outlet, useLocation } from 'react-router-dom-v5-compat';
import { NavModelItem } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';

import { ROUTES } from 'types';
import { getRoute } from 'components/Routing.utils';

import { DataTestIds } from '../../test/dataTestIds';
import { getSecretsNavModel } from './tabs/SecretsTab';
import { getConfigTabUrl } from './ConfigPageLayout.utils';

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

  const pageNav: NavModelItem = useMemo(() => {
    const baseNav: NavModelItem = {
      icon: 'sliders-v-alt',
      text: 'General',
      subTitle: 'Configure your Synthetic Monitoring settings',
      url: getConfigTabUrl(),
      hideFromBreadcrumbs: true, // It will stack with the parent breadcrumb ('config')
    };

    const tabs: NavModelItem[] = [
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
      ...getSecretsNavModel(activeTab('secrets')),
    ];

    return {
      ...baseNav,
      children: tabs,
    };
  }, [activeTab]);

  // Since PluginPage doesn't render in tests, we need to provide a way to test the active tab
  let _testActiveTab = null;
  if (process.env.NODE_ENV === 'test') {
    _testActiveTab = (
      <div data-testid={DataTestIds.CONFIG_PAGE_LAYOUT_ACTIVE_TAB}>
        {pageNav?.children?.find((child) => child.active)?.text ?? 'No active tab'}
      </div>
    );
  }

  return (
    <PluginPage pageNav={pageNav}>
      <Outlet />
      {_testActiveTab}
    </PluginPage>
  );
}
