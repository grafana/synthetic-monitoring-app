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
  CheckSuggestions = 'check-suggestions',
  Configuration = 'configuration',
}

export interface SyntheticsTabVisibility {
  checks: boolean;
  probes: boolean;
  checkSuggestions: boolean;
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

  // Also shown on its own page, which renders while the AI gate is still loading or closed.
  if (visibility.checkSuggestions || isCheckSuggestions) {
    tabs.push({
      text: 'Check Suggestions',
      url: getRoute(AppRoutes.ReliabilityInbox),
      active: isCheckSuggestions,
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
