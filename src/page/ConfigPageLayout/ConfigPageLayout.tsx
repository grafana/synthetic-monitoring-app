import React, { useMemo } from 'react';
import { Outlet } from 'react-router';
import { NavModelItem } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';

import { FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { useActiveTab, useTabUrl } from 'hooks/useActiveTab';
import { useFeatureFlag } from 'hooks/useFeatureFlag';

export function ConfigPageLayout() {
  const getConfigTabUrl = useTabUrl(AppRoutes.Config);
  const activeTab = useActiveTab(AppRoutes.Config);
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
        {
          // The tab itself limits mode changes to admins and shows a contact-admin notice otherwise.
          icon: 'tag-alt',
          text: 'Label migration',
          url: getConfigTabUrl('label-migration'),
          active: activeTab('label-migration'),
        },
      ],
    };

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
  }, [activeTab, getConfigTabUrl, isSecretsManagementEnabled]);

  return (
    <PluginPage pageNav={pageNav}>
      <Outlet />
    </PluginPage>
  );
}
