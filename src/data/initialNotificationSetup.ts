import {
  type Receiver,
  type RoutingTree,
  type RoutingTreeRoute,
} from '@grafana/api-clients/rtkq/notifications.alerting/v1beta1';
import { config, isFetchError } from '@grafana/runtime';

import { getDefaultRoutingTree } from 'components/CheckForm/AlertsPerCheck/alertRoutingUtils';
import {
  getNotificationSetupEligibility,
  parseNotificationEmails,
  SM_CONTACT_POINT_TITLE,
  SM_NAMESPACE,
  validNotificationEmails,
} from 'components/CheckForm/AlertsPerCheck/notificationSetup';

import { fetchNotificationRouting, notificationRequest } from './useNotificationRouting';

export function canSetUpNotifications(tree?: RoutingTree): boolean {
  const permissions = config.bootData.user.permissions;
  const canCreateReceiver =
    permissions?.['alert.notifications:write'] || permissions?.['alert.notifications.receivers:create'];
  const canWriteTree =
    permissions?.['alert.notifications:write'] ||
    permissions?.['alert.notifications.routes:write'] ||
    tree?.metadata.annotations?.['grafana.com/access/canWrite'] === 'true';
  return Boolean(canCreateReceiver && canWriteTree);
}

// Kept by a single save attempt, including explicit retries. Never infer route
// ownership from a label match or adopt and rewrite an existing contact point.
export interface InitialNotificationSetup {
  emails: string;
  receiver?: Receiver;
  receiverAttempted?: boolean;
  completed?: boolean;
}

function sameEmails(receiver: Receiver, emails: string): boolean {
  const integrations = receiver.spec.integrations;
  return (
    integrations.length === 1 &&
    integrations[0].type === 'email' &&
    typeof integrations[0].settings.addresses === 'string' &&
    JSON.stringify(parseNotificationEmails(integrations[0].settings.addresses).sort()) ===
      JSON.stringify(parseNotificationEmails(emails).sort())
  );
}

function isSetupRoute(route: RoutingTreeRoute): boolean {
  return (
    route.receiver === SM_CONTACT_POINT_TITLE &&
    route.continue === false &&
    route.matchers?.length === 1 &&
    route.matchers[0].label === 'namespace' &&
    route.matchers[0].type === '=' &&
    route.matchers[0].value === SM_NAMESPACE &&
    !route.routes?.length &&
    !route.mute_time_intervals?.length &&
    !route.active_time_intervals?.length
  );
}

export async function createInitialNotificationSetup(attempt: InitialNotificationSetup): Promise<void> {
  if (!validNotificationEmails(attempt.emails)) {
    throw new Error('Enter a valid list of email addresses.');
  }

  let snapshot = await fetchNotificationRouting();
  if (!canSetUpNotifications(getDefaultRoutingTree(snapshot.trees))) {
    throw new Error(
      'You do not have permission to configure notifications. Ask an administrator or use Grafana Alerting.'
    );
  }
  const existing = snapshot.contactPoints.find(({ spec }) => spec.title === SM_CONTACT_POINT_TITLE);
  if (attempt.receiver || (attempt.receiverAttempted && existing)) {
    if (
      !existing ||
      !sameEmails(existing, attempt.emails) ||
      (attempt.receiver && existing.metadata.name !== attempt.receiver.metadata.name)
    ) {
      throw new Error(
        'The Synthetic Monitoring contact point changed. Review it in Grafana Alerting before continuing.'
      );
    }
    attempt.receiver = existing;
    if (getDefaultRoutingTree(snapshot.trees)?.spec.routes.some(isSetupRoute)) {
      attempt.completed = true;
      return;
    }
    if (attempt.completed) {
      throw new Error('The Synthetic Monitoring policy was changed or removed. Manage it in Grafana Alerting.');
    }
  }

  let eligibility = getNotificationSetupEligibility(
    snapshot.trees,
    snapshot.contactPoints,
    attempt.receiver?.metadata.name
  );
  if (eligibility.status !== 'available') {
    throw new Error(
      'Notification routing has changed or cannot be verified. Review it in Grafana Alerting before setting up notifications.'
    );
  }

  if (!attempt.receiver) {
    attempt.receiverAttempted = true;
    // The API generates metadata.name. A unique, stable title prevents another
    // receiver being created if the response is lost or setup is retried.
    attempt.receiver = await notificationRequest<Receiver>('receivers', 'POST', {
      apiVersion: 'notifications.alerting.grafana.app/v1beta1',
      kind: 'Receiver',
      metadata: {},
      spec: {
        title: SM_CONTACT_POINT_TITLE,
        integrations: [
          { type: 'email', version: 'v1', settings: { addresses: parseNotificationEmails(attempt.emails).join(';') } },
        ],
      },
    } satisfies Receiver);
  }

  // Re-read after creating the receiver. Preserve unrelated routes and timing,
  // and send resourceVersion so a concurrent policy edit rejects this write.
  snapshot = await fetchNotificationRouting();
  const savedReceiver = snapshot.contactPoints.find(
    ({ metadata }) => metadata.name === attempt.receiver?.metadata.name
  );
  if (!savedReceiver || !sameEmails(savedReceiver, attempt.emails)) {
    throw new Error('The contact point changed during setup. Review it in Grafana Alerting before adding a policy.');
  }
  eligibility = getNotificationSetupEligibility(snapshot.trees, snapshot.contactPoints, attempt.receiver.metadata.name);
  if (eligibility.status !== 'available') {
    throw new Error(
      'The contact point was created, but notification routing changed. Review the policies in Grafana Alerting.'
    );
  }
  const { tree } = eligibility;
  try {
    await notificationRequest(`routingtrees/${encodeURIComponent(tree.metadata.name!)}`, 'PUT', {
      ...tree,
      spec: {
        ...tree.spec,
        routes: [
          ...tree.spec.routes,
          {
            receiver: SM_CONTACT_POINT_TITLE,
            continue: false,
            matchers: [{ label: 'namespace', type: '=', value: SM_NAMESPACE }],
          },
        ],
      },
    });
  } catch (error) {
    if (isFetchError(error) && error.status === 409) {
      throw new Error(
        'Notification policies changed during setup. Retry to check the latest configuration, or review it in Grafana Alerting.'
      );
    }
    throw error;
  }
  attempt.completed = true;
}
