import { findMatchingRoutes, matchInstancesToRouteTrees, type RouteMatch } from '@grafana/alerting';
import { type Receiver } from '@grafana/api-clients/rtkq/notifications.alerting/v1beta1';

import { convertLabelsToLabelPairs, getDefaultRoutingTree, type RoutingTree } from './alertRoutingUtils';
import { isContactPointConfigured } from './notificationSetup';

type PolicyRoute = RoutingTree['spec']['routes'][number];

export interface NotificationDestination {
  name: string;
  status: 'configured' | 'missing';
}

export type NotificationRouting =
  | { status: 'unknown' }
  | { status: 'configured' | 'missing'; destinations: NotificationDestination[]; usesDefaultPolicyOnly: boolean };

// Grafana's shared preview uses native RegExp. Limit it to syntax and inputs
// that agree with Alertmanager's RE2 matcher. This is deliberately conservative,
// not a translator for RE2-only syntax. Unsupported patterns remain unknown.
function canPreviewRegex(pattern: string, labelValue: string): boolean {
  // Unicode, control characters and line endings differ between the engines.
  if (/[^\x20-\x7e]/.test(pattern) || /[^\x20-\x7e]/.test(labelValue)) {
    return false;
  }
  // Grafana supports a leading case-insensitive flag. Flags elsewhere can
  // change scope when its helper extracts them, so they are not accepted.
  const expression = pattern.replace(/^\(\?i\)/, '');
  const syntax = expression.replace(/\\(.)/g, (_, escaped: string) =>
    'dDsSwW\\^$.*+?()[]{}|/-'.includes(escaped) ? 'a' : '\\'
  );
  // Reject other escapes, special groups, empty classes and nested/POSIX
  // classes, including forms that JavaScript accepts with different meanings.
  if (syntax.includes('\\') || /\(\?(?!:)|\[\^?\]|\[[^[\]]*\[/.test(syntax)) {
    return false;
  }
  try {
    new RegExp(`^(?:${expression})$`);
    return true;
  } catch {
    return false;
  }
}

function inspectRoutes(routes: PolicyRoute[], labels: Record<string, string>): PolicyRoute[] | undefined {
  const inspected: PolicyRoute[] = [];
  const labelPairs = convertLabelsToLabelPairs(labels);
  for (const route of routes) {
    const matchers = route.matchers ?? [];
    const supported = matchers.filter(
      ({ label, type, value }) =>
        // An unrepresented runtime label is unknown, not necessarily absent.
        Object.hasOwn(labels, label) && (type === '=' || type === '!=' || canPreviewRegex(value, labels[label]))
    );
    // A known non-match excludes the branch even when another matcher cannot
    // be inspected. Prune it so the shared helper never evaluates that matcher.
    if (!findMatchingRoutes({ ...route, matchers: supported, routes: [] }, labelPairs).length) {
      continue;
    }
    if (supported.length !== matchers.length) {
      return undefined;
    }
    const children = inspectRoutes(route.routes ?? [], labels);
    if (!children) {
      return undefined;
    }
    inspected.push({ ...route, routes: children });
    // A matching policy with continue disabled makes later siblings irrelevant.
    if (!route.continue) {
      break;
    }
  }
  return inspected;
}

// Shared by the summary, expanded preview and save-time check so they resolve
// the same destination. Initial setup eligibility uses separate, stricter rules.
export function getMatchingNotificationRoutes(
  trees: RoutingTree[],
  labels: Record<string, string>
): RouteMatch[] | undefined {
  const tree = getDefaultRoutingTree(trees);
  if (!tree) {
    return undefined;
  }
  try {
    const routes = inspectRoutes(tree.spec.routes, labels);
    if (!routes) {
      return undefined;
    }
    const [result] = matchInstancesToRouteTrees(
      [{ ...tree, spec: { ...tree.spec, routes } }],
      [convertLabelsToLabelPairs(labels)]
    );
    return result?.matchedRoutes;
  } catch {
    return undefined;
  }
}

export function inspectNotificationRouting(
  trees: RoutingTree[],
  contactPoints: Receiver[],
  labels: Record<string, string>
): NotificationRouting {
  try {
    const routes = getMatchingNotificationRoutes(trees, labels);
    if (!routes?.length) {
      return { status: 'unknown' };
    }

    const names = new Set<string>();
    for (const { route } of routes) {
      // The library's expanded Route type does not expose all inherited fields.
      if (!('receiver' in route) || typeof route.receiver !== 'string' || !route.receiver) {
        return { status: 'unknown' };
      }
      names.add(route.receiver);
    }

    // Lists can be filtered by permissions. Absence does not prove a receiver
    // has been deleted or is unconfigured.
    if (Array.from(names).some((name) => !contactPoints.some(({ spec }) => spec.title === name))) {
      return { status: 'unknown' };
    }

    const destinations: NotificationDestination[] = Array.from(names, (name) => {
      const contactPoint = contactPoints.find(({ spec }) => spec.title === name);
      const hasIntegration = contactPoint && isContactPointConfigured(contactPoint);
      return { name, status: hasIntegration ? 'configured' : 'missing' };
    });

    return {
      status: destinations.some(({ status }) => status === 'missing') ? 'missing' : 'configured',
      destinations,
      usesDefaultPolicyOnly: routes.every(({ matchDetails }) => matchDetails.matchingJourney.length === 1),
    };
  } catch {
    return { status: 'unknown' };
  }
}
