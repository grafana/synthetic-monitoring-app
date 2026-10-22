import { routingTreeFactory } from 'test/factories/routingTree';
import {
  DEFAULT_NOTIFICATION_CONTACT_POINT,
  DEFAULT_NOTIFICATION_TREE,
  UNCONFIGURED_NOTIFICATION_CONTACT_POINT,
} from 'test/fixtures/notificationRouting';

import { getNotificationSetupEligibility } from './notificationSetup';

it.each([
  { label: 'namespace', type: '=', value: 'payments' },
  { label: 'namespace', type: '!=', value: 'synthetic_monitoring' },
] as const)('allows a branch that excludes all SM alerts: %j', (matcher) => {
  const tree = routingTreeFactory.build({
    ...DEFAULT_NOTIFICATION_TREE,
    spec: {
      ...DEFAULT_NOTIFICATION_TREE.spec,
      routes: [
        {
          continue: false,
          matchers: [matcher],
          routes: [{ continue: true, matchers: [{ label: 'job', type: '=~', value: '.*' }] }],
        },
      ],
    },
  });
  expect(getNotificationSetupEligibility([tree], [UNCONFIGURED_NOTIFICATION_CONTACT_POINT]).status).toBe('available');
});

it.each([
  { label: 'job', type: '=', value: 'another-check' },
  { label: 'namespace', type: '=~', value: 'payments.*' },
  { label: 'namespace', type: '=', value: 'synthetic_monitoring' },
  { label: 'namespace', type: '!=', value: 'payments' },
] as const)('does not infer safe shared setup from a per-check mismatch or regex: %j', (matcher) => {
  const tree = routingTreeFactory.build({
    ...DEFAULT_NOTIFICATION_TREE,
    spec: { ...DEFAULT_NOTIFICATION_TREE.spec, routes: [{ continue: false, matchers: [matcher] }] },
  });
  expect(getNotificationSetupEligibility([tree], [UNCONFIGURED_NOTIFICATION_CONTACT_POINT]).status).toBe('managed');
});

it('treats a hidden default destination or missing version as unknown', () => {
  expect(getNotificationSetupEligibility([DEFAULT_NOTIFICATION_TREE], []).status).toBe('unknown');
  expect(
    getNotificationSetupEligibility(
      [{ ...DEFAULT_NOTIFICATION_TREE, metadata: { name: DEFAULT_NOTIFICATION_TREE.metadata.name } }],
      [UNCONFIGURED_NOTIFICATION_CONTACT_POINT]
    ).status
  ).toBe('unknown');
});

it('preserves a usable default destination', () => {
  expect(
    getNotificationSetupEligibility([DEFAULT_NOTIFICATION_TREE], [DEFAULT_NOTIFICATION_CONTACT_POINT]).status
  ).toBe('managed');
});
