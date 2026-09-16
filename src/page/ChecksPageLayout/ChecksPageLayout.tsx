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

/**
 * Wraps the check list and its sibling tabs. Only the tabbed routes sit under this layout:
 * the check editor and dashboard pages stay outside it so they keep their own page chrome.
 */
export function ChecksPageLayout() {
  const getChecksTabUrl = useTabUrl(AppRoutes.Checks);
  const activeTab = useActiveTab(AppRoutes.Checks);
  const { isEnabled: isRecommendationsEnabled } = useFeatureFlag(FeatureName.Recommendations);

  const pageNav: NavModelItem | undefined = useMemo(() => {
    // Recommendations is the only sibling tab, so with the flag off (or not yet resolved)
    // there is nothing to switch between and the page keeps the plain header it has always had.
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
          // `tabSuffix` is the extension point Grafana's PageTabs forwards to a Tab; the
          // `isNew` flag on a NavModelItem is read by the mega menu, not by page tabs.
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
