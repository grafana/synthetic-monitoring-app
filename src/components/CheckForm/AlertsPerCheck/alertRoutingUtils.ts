import {
  type InstanceMatchResult,
  type Label as AlertingLabel,
  type LabelMatcher,
  type Route,
  RouteWithID,
} from '@grafana/alerting';
import { RouteMatchInfo } from '@grafana/alerting/dist/types/grafana/notificationPolicies/utils';

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
      matchingJourney.forEach((journey: RouteMatchInfo<RouteWithID>) => {
        //@ts-ignore
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

export const getPolicyIdentifier = (route: Route, isDefaultPolicy: boolean): PolicyInfo => {
  if (isDefaultPolicy) {
    return { text: 'Default policy', type: 'default' };
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
