import {
  type Receiver,
  type ReceiverList,
  type RoutingTree,
  type RoutingTreeList,
} from '@grafana/api-clients/rtkq/notifications.alerting/v1beta1';
import { DEFAULT_NOTIFICATION_CONTACT_POINT, DEFAULT_NOTIFICATION_TREE } from 'test/fixtures/notificationRouting';

import { ApiEntry } from './types';

export const listNotificationRoutingTrees: ApiEntry<RoutingTreeList> = {
  route: /\/apis\/notifications\.alerting\.grafana\.app\/v1beta1\/namespaces\/[^/]+\/routingtrees/,
  method: 'get',
  result: () => ({ json: { items: [DEFAULT_NOTIFICATION_TREE], metadata: {} } }),
};

export const listNotificationContactPoints: ApiEntry<ReceiverList> = {
  route: /\/apis\/notifications\.alerting\.grafana\.app\/v1beta1\/namespaces\/[^/]+\/receivers/,
  method: 'get',
  result: () => ({ json: { items: [DEFAULT_NOTIFICATION_CONTACT_POINT], metadata: {} } }),
};

export const createNotificationContactPoint: ApiEntry<Receiver> = {
  route: /\/apis\/notifications\.alerting\.grafana\.app\/v1beta1\/namespaces\/[^/]+\/receivers$/,
  method: 'post',
  result: async (req) => ({ json: { ...(await req.json()), metadata: { name: 'sm-email', resourceVersion: '1' } } }),
};

export const updateNotificationRoutingTree: ApiEntry<RoutingTree> = {
  route: /\/apis\/notifications\.alerting\.grafana\.app\/v1beta1\/namespaces\/[^/]+\/routingtrees\/[^/]+$/,
  method: 'put',
  result: async (req) => ({ json: await req.json() }),
};
