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
}

export interface SyntheticsTabVisibility {
  checks: boolean;
  probes: boolean;
  recommendations: boolean;
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

export function getSyntheticsPageNav(activeTab: SyntheticsTab, visibility: SyntheticsTabVisibility): NavModelItem {
  const isOverview = activeTab === SyntheticsTab.Home;
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

  // Check Suggestions renders its own page header, so this tab is never the active one.
  if (visibility.recommendations) {
    tabs.push({
      text: 'Recommendations',
      url: getRoute(AppRoutes.ReliabilityInbox),
      tabSuffix: NewFeatureTabSuffix,
    });
  }

  tabs.push({
    text: 'Configuration',
    url: configurationUrl,
    active: isConfiguration,
  });

  return {
    // Only Overview adds its own crumb; the other tabs keep the Synthetics section trail unchanged.
    text: isOverview ? 'Overview' : isConfiguration ? 'Configuration' : 'Synthetics',
    url: isOverview ? OVERVIEW_BREADCRUMB_URL : isConfiguration ? configurationUrl : getRoute(AppRoutes.Home),
    hideFromBreadcrumbs: !isOverview,
    children: tabs,
  };
}
