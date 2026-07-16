import {
  type InstanceMatchResult,
  type Label as AlertingLabel,
  type LabelMatcher,
  matchInstancesToRouteTrees,
  type Route,
  USER_DEFINED_TREE_NAME,
} from '@grafana/alerting';

type RoutingTree = Parameters<typeof matchInstancesToRouteTrees>[0][number];

import { CheckAlertType, CheckType, Label } from 'types';

export interface PolicyInfo {
  text: string;
  type: 'default' | 'matchers' | 'matchesAll';
}

export const generateAlertLabels = (
  alertType: CheckAlertType,
  {
    checkType,
    frequency,
    customLabels,
    job,
    instance,
  }: { checkType: CheckType; frequency: number; customLabels: Label[]; job: string; instance: string }
): Record<string, string> => {
  const labels: Record<string, string> = {
    job: job || '',
    instance: instance || '',
    check_name: checkType || '',
    frequency: frequency?.toString() || '',
    namespace: 'synthetic_monitoring',
    grafana_folder: 'Grafana Synthetic Monitoring',
    label_per_check_alerts: 'true',
    alertname: alertType,
  };

  (customLabels || []).forEach((label: Label) => {
    if (label.name && label.value) {
      labels[`label_${label.name}`] = label.value;
    }
  });

  return labels;
};

export const convertLabelsToLabelPairs = (alertLabels: Record<string, string>): AlertingLabel[] => {
  return Object.entries(alertLabels).map(([name, value]) => [name, value]);
};

export const extractMatchersFromRoutes = (routeMatches: InstanceMatchResult[]): LabelMatcher[] => {
  const matchersMap = new Map<string, LabelMatcher>();

  routeMatches.forEach((routeMatch) => {
    routeMatch.matchedRoutes?.forEach((matchedRoute) => {
      const matchingJourney = matchedRoute.matchDetails?.matchingJourney || [];
      matchingJourney.forEach((journey) => {
        // @ts-expect-error matchers exist on the route at runtime but aren't in the Route type
        journey.route.matchers?.forEach((matcher: LabelMatcher) => {
          const matcherKey = `${matcher.label}:${matcher.type}:${matcher.value}`;
          matchersMap.set(matcherKey, matcher);
        });
      });
    });
  });

  return Array.from(matchersMap.values());
};

export const encodeReceiverForUrl = (receiverName: string): string => {
  const utf8Bytes = new TextEncoder().encode(receiverName);
  const receiverId = btoa(String.fromCharCode(...utf8Bytes));
  return receiverId.replace(/=+$/, '');
};

/**
 * Returns the default (user-defined) routing tree from the list. The routing tree
 * API does not guarantee ordering, so the default tree is matched by name rather
 * than assuming it is the first item.
 */
export const getDefaultRoutingTree = (trees: RoutingTree[]): RoutingTree | undefined => {
  return trees.find((tree) => tree.metadata?.name === USER_DEFINED_TREE_NAME);
};

export const getPolicyIdentifier = (route: Route, isRootPolicy: boolean, treeName?: string): PolicyInfo => {
  if (isRootPolicy) {
    // Each routing tree has a root policy with no matchers. Only the default
    // ("user-defined") tree should be shown as "Default policy"; named trees
    // (available with the alertingMultiplePolicies feature) show their own name.
    const isDefaultTree = !treeName || treeName === USER_DEFINED_TREE_NAME;
    return { text: isDefaultTree ? 'Default policy' : treeName, type: 'default' };
  }

  const hasMatchers = route.matchers && route.matchers.length > 0;
  if (hasMatchers) {
    return {
      text: route.matchers?.map((m: LabelMatcher) => `${m.label}${m.type}${m.value}`).join(', ') || '',
      type: 'matchers',
    };
  }

  return { text: '* (matches all)', type: 'matchesAll' };
};

export const isLabelMatched = (labelKey: string, labelValue: string, matchers: LabelMatcher[]): boolean => {
  return matchers.some((matcher: LabelMatcher) => matcher.label === labelKey && matcher.value === labelValue);
};
