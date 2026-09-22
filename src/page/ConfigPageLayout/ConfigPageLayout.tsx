import React, { useCallback, useMemo } from 'react';
import { matchPath, Outlet, useLocation } from 'react-router';
import { NavModelItem } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';

import { FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { useFeatureFlag } from 'hooks/useFeatureFlag';

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
  const { isEnabled: isLabelMigrationEnabled } = useFeatureFlag(FeatureName.LabelMigration);
  const { isEnabled: isSecretsManagementEnabled } = useFeatureFlag(FeatureName.SecretsManagement);

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

    // Label Migration is feature-flagged for rollout. The tab itself limits
    // mode changes to admins and shows a contact-admin notice otherwise.
    if (isLabelMigrationEnabled) {
      navModel.children!.push({
        icon: 'tag-alt',
        text: 'Label migration',
        url: getConfigTabUrl('label-migration'),
        active: activeTab('label-migration'),
      });
    }

    // Add secrets management tab if the feature is enabled
    if (isSecretsManagementEnabled) {
      navModel.children!.push({
        icon: 'key-skeleton-alt',
        text: 'Secrets',
        url: getConfigTabUrl('secrets'),
        active: activeTab('secrets'),
      });
    }
    return navModel;
  }, [activeTab, isLabelMigrationEnabled, isSecretsManagementEnabled]);

  return (
    <PluginPage pageNav={pageNav}>
      <Outlet />
    </PluginPage>
  );
}
