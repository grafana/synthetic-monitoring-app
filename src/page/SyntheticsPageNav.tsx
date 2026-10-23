import { NavModelItem } from '@grafana/data';
import { t } from '@grafana/i18n';

import { PLUGIN_URL_PATH } from 'routing/constants';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { NewBadge } from 'components/NewStatusBadge';
import { getRecommendationsTabUrl } from 'page/ChecksPageLayout/tabs/Recommendations/Recommendations.links';

export enum SyntheticsTab {
  Home = 'home',
  Checks = 'checks',
  Probes = 'probes',
  Recommendations = 'recommendations',
  CheckSuggestions = 'check-suggestions',
  Configuration = 'configuration',
}

export interface SyntheticsTabVisibility {
  checks: boolean;
  probes: boolean;
  recommendations: boolean;
  checkSuggestions: boolean;
}

// Distinct from /home and the plugin root so Grafana does not skip the Synthetics section crumb.
export const OVERVIEW_BREADCRUMB_URL = `${PLUGIN_URL_PATH.replace(/\/$/, '')}/overview`;

export function getSyntheticsPageNav(activeTab: SyntheticsTab, visibility: SyntheticsTabVisibility): NavModelItem {
  const isOverview = activeTab === SyntheticsTab.Home;
  const isCheckSuggestions = activeTab === SyntheticsTab.CheckSuggestions;
  const isConfiguration = activeTab === SyntheticsTab.Configuration;
  const configurationUrl = getRoute(AppRoutes.Config);
  const tabs: NavModelItem[] = [
    {
      text: 'Overview',
      url: getRoute(AppRoutes.Home),
      active: isOverview,
    },
  ];

  if (visibility.checks) {
    tabs.push({
      text: 'Checks',
      url: getRoute(AppRoutes.Checks),
      active: activeTab === SyntheticsTab.Checks,
    });
  }

  if (visibility.probes) {
    tabs.push({
      text: 'Probes',
      url: getRoute(AppRoutes.Probes),
      active: activeTab === SyntheticsTab.Probes,
    });
  }

  if (visibility.recommendations) {
    tabs.push({
      text: t('syntheticsPageNav.tabs.recommendations', 'Recommendations'),
      url: getRecommendationsTabUrl(getRoute(AppRoutes.CheckRecommendations)),
      active: activeTab === SyntheticsTab.Recommendations,
      tabSuffix: NewBadge,
    });
  }

  // Also shown on its own page, which renders while the AI gate is still loading or closed.
  if (visibility.checkSuggestions || isCheckSuggestions) {
    tabs.push({
      text: 'Check Suggestions',
      url: getRoute(AppRoutes.ReliabilityInbox),
      active: isCheckSuggestions,
      tabSuffix: NewBadge,
    });
  }

  tabs.push({
    text: 'Configuration',
    url: configurationUrl,
    active: isConfiguration,
  });

  return {
    // Grafana appends the active child as a breadcrumb except for the first tab.
    // Match the manifest's app-root URL so Grafana deduplicates its Synthetics section crumb.
    text: isOverview ? 'Overview' : 'Synthetics',
    url: isOverview ? OVERVIEW_BREADCRUMB_URL : PLUGIN_URL_PATH.replace(/\/$/, ''),
    children: tabs,
  };
}

export function getSyntheticsDetailPageNav(section: 'Checks' | 'Probes', page: NavModelItem): NavModelItem {
  return {
    ...page,
    parentItem: {
      text: section,
      url: getRoute(section === 'Checks' ? AppRoutes.Checks : AppRoutes.Probes),
      parentItem: {
        text: 'Synthetics',
        // Match Grafana's section URL so it does not append another Synthetics crumb.
        url: PLUGIN_URL_PATH.replace(/\/$/, ''),
      },
    },
  };
}
