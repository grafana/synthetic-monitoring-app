import { USER_DEFINED_TREE_NAME } from '@grafana/alerting';

import { notificationContactPointFactory } from '../factories/notificationContactPoint';
import { routingTreeFactory } from '../factories/routingTree';

export const DEFAULT_NOTIFICATION_TREE = routingTreeFactory.build({ metadata: { name: USER_DEFINED_TREE_NAME } });
export const DEFAULT_NOTIFICATION_CONTACT_POINT = notificationContactPointFactory.build();
export const SECOND_NOTIFICATION_CONTACT_POINT = notificationContactPointFactory.build({
  spec: { title: 'SM second team' },
});
export const MULTI_DESTINATION_NOTIFICATION_TREE = routingTreeFactory.build({
  metadata: { name: USER_DEFINED_TREE_NAME },
  spec: {
    routes: [
      {
        matchers: [{ label: 'namespace', type: '=', value: 'synthetic_monitoring' }],
        receiver: 'grafana-default-email',
        continue: false,
        routes: [
          {
            matchers: [{ label: 'check_name', type: '=', value: 'http' }],
            // This branch inherits its contact point from the SM parent.
            continue: true,
          },
          {
            matchers: [{ label: 'check_name', type: '=', value: 'http' }],
            receiver: 'SM second team',
            continue: false,
          },
        ],
      },
    ],
  },
});
export const UNCONFIGURED_NOTIFICATION_CONTACT_POINT = notificationContactPointFactory.build({
  spec: { integrations: [{ type: 'email', version: 'v1', settings: { addresses: '' } }] },
});

export const NON_SM_NOTIFICATION_TREE = routingTreeFactory.build({
  metadata: { name: USER_DEFINED_TREE_NAME },
  spec: {
    routes: [
      {
        continue: false,
        receiver: 'grafana-default-email',
        matchers: [{ label: 'namespace', type: '=', value: 'payments' }],
      },
    ],
  },
});
export const EXISTING_SM_NOTIFICATION_TREE = routingTreeFactory.build({
  metadata: { name: USER_DEFINED_TREE_NAME },
  spec: {
    routes: [
      {
        continue: false,
        receiver: 'grafana-default-email',
        matchers: [{ label: 'job', type: '=', value: 'another-check' }],
      },
    ],
  },
});
export const PROVISIONED_NOTIFICATION_TREE = routingTreeFactory.build({
  metadata: { name: USER_DEFINED_TREE_NAME, annotations: { 'grafana.com/provenance': 'file' } },
});

export const PLACEHOLDER_NOTIFICATION_CONTACT_POINT = notificationContactPointFactory.build({
  spec: { integrations: [{ type: 'email', version: 'v1', settings: { addresses: '<example@email.com>' } }] },
});
export const EMPTY_NOTIFICATION_CONTACT_POINT = notificationContactPointFactory.build({
  spec: { title: 'empty', integrations: [] },
});
export const EMPTY_NOTIFICATION_TREE = routingTreeFactory.build({
  metadata: { name: USER_DEFINED_TREE_NAME },
  spec: { defaults: { receiver: 'empty' } },
});
