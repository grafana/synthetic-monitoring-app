import React, { useMemo } from 'react';
import { Outlet } from 'react-router';
import { NavModelItem } from '@grafana/data';
import { t } from '@grafana/i18n';
import { PluginPage } from '@grafana/runtime';

import { FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { useActiveTab, useTabUrl } from 'hooks/useActiveTab';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { NewBadge } from 'components/NewStatusBadge';

// Only the tabbed routes sit under this; the editor and dashboards keep their own page chrome.
export function ChecksPageLayout() {
  const getChecksTabUrl = useTabUrl(AppRoutes.Checks);
  const activeTab = useActiveTab(AppRoutes.Checks);
  const { isEnabled: isRecommendationsEnabled } = useFeatureFlag(FeatureName.Recommendations);

  const pageNav: NavModelItem | undefined = useMemo(() => {
    // With the only sibling tab off there is nothing to switch between.
    if (!isRecommendationsEnabled) {
      return undefined;
    }

    return {
      text: t('checksPageLayout.title', 'Checks'),
      url: getChecksTabUrl(),
      hideFromBreadcrumbs: true, // It would stack with the parent breadcrumb ('checks')
      children: [
        {
          icon: 'check-square',
          text: t('checksPageLayout.tabs.checks', 'Checks'),
          url: getChecksTabUrl(),
          active: activeTab(),
        },
        {
          icon: 'lightbulb-alt',
          text: t('checksPageLayout.tabs.recommendations', 'Recommendations'),
          url: getChecksTabUrl('recommendations'),
          active: activeTab('recommendations'),
          // `isNew` is read by the mega menu, not by page tabs.
          tabSuffix: NewBadge,
        },
      ],
    };
  }, [activeTab, getChecksTabUrl, isRecommendationsEnabled]);

  return (
    <PluginPage pageNav={pageNav}>
      <Outlet />
    </PluginPage>
  );
}
