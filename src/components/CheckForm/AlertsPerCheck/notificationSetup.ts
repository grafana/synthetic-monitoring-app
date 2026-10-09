import { type Receiver, type RoutingTree } from '@grafana/api-clients/rtkq/notifications.alerting/v1beta1';
import { z } from 'zod';

import { getDefaultRoutingTree } from './alertRoutingUtils';

export const SM_CONTACT_POINT_TITLE = 'Synthetic Monitoring email';
export const SM_NAMESPACE = 'synthetic_monitoring';

export function parseNotificationEmails(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[;,\s]+/)
        .map((email) => email.trim())
        .filter(Boolean)
    )
  );
}

export function validNotificationEmails(value: string): boolean {
  const emails = parseNotificationEmails(value);
  return emails.length > 0 && emails.every((email) => z.email().safeParse(email).success);
}

export function isContactPointConfigured(receiver: Receiver): boolean {
  return receiver.spec.integrations.some(({ type, settings }) => {
    if (type !== 'email') {
      return true;
    }
    if (typeof settings.addresses !== 'string' || !settings.addresses.trim()) {
      return false;
    }
    // Existing stacks can still have Grafana's shipped placeholder receiver.
    // Other nonempty configurations may contain templates or display names, so
    // do not reinterpret them as permission to install shared routing.
    return (
      receiver.spec.title !== 'grafana-default-email' || !/^<?example@email\.com>?$/i.test(settings.addresses.trim())
    );
  });
}

// A shared route covers every SM check. Only the namespace rule label is fixed
// across all of them. A mismatch on this check's job, target or custom labels is
// not evidence that a branch cannot match another SM check.
export function excludesSyntheticMonitoring(route: RoutingTree['spec']['routes'][number]): boolean {
  return (route.matchers ?? []).some(
    ({ label, type, value }) =>
      label === 'namespace' && ((type === '=' && value !== SM_NAMESPACE) || (type === '!=' && value === SM_NAMESPACE))
  );
}

export type NotificationSetupEligibility =
  | { status: 'available'; tree: RoutingTree }
  | { status: 'managed' | 'unknown' };

export function getNotificationSetupEligibility(
  trees: RoutingTree[],
  contactPoints: Receiver[],
  pendingReceiverName?: string
): NotificationSetupEligibility {
  const tree = getDefaultRoutingTree(trees);
  if (!tree?.metadata.resourceVersion || tree.metadata.deletionTimestamp) {
    return { status: 'unknown' };
  }
  const receiver = contactPoints.find(({ spec }) => spec.title === tree.spec.defaults.receiver);
  if (!receiver) {
    return { status: 'unknown' };
  }
  if (
    Boolean(tree.metadata.annotations?.['grafana.com/provenance']) ||
    isContactPointConfigured(receiver) ||
    !tree.spec.routes.every(excludesSyntheticMonitoring) ||
    contactPoints.some(
      ({ spec, metadata }) => spec.title === SM_CONTACT_POINT_TITLE && metadata.name !== pendingReceiverName
    )
  ) {
    return { status: 'managed' };
  }
  return { status: 'available', tree };
}
