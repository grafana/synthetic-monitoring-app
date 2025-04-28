import React, { useCallback, useMemo } from 'react';
import { matchPath, Outlet, useLocation } from 'react-router-dom-v5-compat';
import { NavModelItem } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';

import { FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { useFeatureFlagContext } from 'hooks/useFeatureFlagContext';

function getConfigTabUrl(tab = '/') {
  return `${getRoute(AppRoutes.Config)}/${tab}`.replace(/\/+/g, '/');
}

function useActiveTab(route: AppRoutes) {
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
  const activeTab = useActiveTab(AppRoutes.Config);
  const { isFeatureEnabled } = useFeatureFlagContext();

  const pageNav: NavModelItem = useMemo(() => {
    const navModel: NavModelItem = {
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
      ],
    };

    // Add secrets management tab if the feature is enabled
    if (isFeatureEnabled(FeatureName.SecretsManagement)) {
      navModel.children!.push({
        icon: 'key-skeleton-alt',
        text: 'Secrets',
        url: getConfigTabUrl('secrets'),
        active: activeTab('secrets'),
      });
    }
    return navModel;
  }, [activeTab, isFeatureEnabled]);

  return (
    <PluginPage pageNav={pageNav}>
      <Outlet />
    </PluginPage>
  );
}
