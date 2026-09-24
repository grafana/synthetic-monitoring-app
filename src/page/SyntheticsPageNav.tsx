import React from 'react';
import { FeatureState, NavModelItem } from '@grafana/data';
import { FeatureBadge } from '@grafana/ui';

import { PLUGIN_URL_PATH } from 'routing/constants';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';

export enum SyntheticsTab {
  Home = 'home',
  Checks = 'checks',
  Probes = 'probes',
  Configuration = 'configuration',
  Recommendations = 'recommendations',
}

// Distinct from /home and the plugin root so Grafana does not skip the Synthetics section crumb.
export const OVERVIEW_BREADCRUMB_URL = `${PLUGIN_URL_PATH.replace(/\/$/, '')}/overview`;

function NewFeatureTabSuffix({ className }: { className?: string }) {
  return (
    <span className={className}>
      <FeatureBadge featureState={FeatureState.new} />
    </span>
  );
}

export function getSyntheticsPageNav(activeTab: SyntheticsTab): NavModelItem {
  const isOverview = activeTab === SyntheticsTab.Home;
  const isRecommendations = activeTab === SyntheticsTab.Recommendations;
  const isConfiguration = activeTab === SyntheticsTab.Configuration;
  const recommendationsUrl = getRoute(AppRoutes.CheckRecommendations);
  const configurationUrl = getRoute(AppRoutes.Config);
  const probesUrl = getRoute(AppRoutes.Probes);
  const tabs: NavModelItem[] = [
    {
      text: 'Overview',
      url: getRoute(AppRoutes.Home),
      active: isOverview,
    },
    {
      text: 'Checks',
      url: getRoute(AppRoutes.Checks),
      active: activeTab === SyntheticsTab.Checks,
    },
    {
      text: 'Probes',
      url: probesUrl,
      active: activeTab === SyntheticsTab.Probes,
    },
    {
      text: 'Recommendations',
      url: recommendationsUrl,
      active: isRecommendations,
      tabSuffix: NewFeatureTabSuffix,
    },
    {
      text: 'Configuration',
      url: configurationUrl,
      active: isConfiguration,
    },
  ];

  if (isRecommendations) {
    // Grafana adds the active tab as an extra crumb when it is not the first child.
    // Keep a hidden copy first so Recommendations replaces Checks instead of duplicating.
    tabs.unshift({
      text: 'Recommendations',
      url: recommendationsUrl,
      active: true,
      hideFromTabs: true,
    });
  }

  if (isConfiguration) {
    tabs.unshift({
      text: 'Configuration',
      url: configurationUrl,
      active: true,
      hideFromTabs: true,
    });
  }

  return {
    // Overview and Recommendations must not share a URL with Synthetics/Checks or Grafana
    // drops or reuses those crumbs. Checks keeps pageNav hidden so its trail stays the same.
    text: isOverview
      ? 'Overview'
      : isRecommendations
        ? 'Recommendations'
        : isConfiguration
          ? 'Configuration'
          : 'Synthetics',
    url: isOverview
      ? OVERVIEW_BREADCRUMB_URL
      : isRecommendations
        ? recommendationsUrl
        : isConfiguration
          ? configurationUrl
          : getRoute(AppRoutes.Home),
    hideFromBreadcrumbs: !isOverview && !isRecommendations,
    parentItem: isRecommendations
      ? {
          text: 'Checks',
          url: getRoute(AppRoutes.Checks),
          hideFromBreadcrumbs: true,
        }
      : undefined,
    children: tabs,
  };
}
