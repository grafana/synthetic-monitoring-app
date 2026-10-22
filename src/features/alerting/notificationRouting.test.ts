import { USER_DEFINED_TREE_NAME } from '@grafana/alerting';
import { notificationContactPointFactory } from 'test/factories/notificationContactPoint';
import { routingTreeFactory } from 'test/factories/routingTree';
import {
  DEFAULT_NOTIFICATION_CONTACT_POINT,
  DEFAULT_NOTIFICATION_TREE,
  UNCONFIGURED_NOTIFICATION_CONTACT_POINT,
} from 'test/fixtures/notificationRouting';

import { type RoutingTree } from './alertRoutingUtils';
import { inspectNotificationRouting } from './notificationRouting';

const labels = { namespace: 'synthetic_monitoring', job: 'checkout', instance: 'https://example.com' };
const teamContact = notificationContactPointFactory.build({ spec: { title: 'Team X' } });
const contactPoints = [DEFAULT_NOTIFICATION_CONTACT_POINT, teamContact];
const defaultResult = {
  status: 'configured',
  destinations: [{ name: 'grafana-default-email', status: 'configured' }],
  usesDefaultPolicyOnly: true,
};
const teamResult = {
  status: 'configured',
  destinations: [{ name: 'Team X', status: 'configured' }],
  usesDefaultPolicyOnly: false,
};

function treeWithRoutes(routes: RoutingTree['spec']['routes']) {
  return routingTreeFactory.build({ metadata: { name: USER_DEFINED_TREE_NAME }, spec: { routes } });
}

describe('notification routing inspection', () => {
  it('uses only the default tree regardless of tree order', () => {
    const otherTree = routingTreeFactory.build({ spec: { defaults: { receiver: 'Team X' } } });
    expect(inspectNotificationRouting([otherTree, DEFAULT_NOTIFICATION_TREE], contactPoints, labels)).toEqual(
      defaultResult
    );
  });

  it('reports an empty email destination without inferring configuration from its name', () => {
    expect(
      inspectNotificationRouting([DEFAULT_NOTIFICATION_TREE], [UNCONFIGURED_NOTIFICATION_CONTACT_POINT], labels)
    ).toEqual({
      status: 'missing',
      destinations: [{ name: 'grafana-default-email', status: 'missing' }],
      usesDefaultPolicyOnly: true,
    });
  });

  it('does not mistake an unreadable contact point for an unconfigured destination', () => {
    expect(inspectNotificationRouting([DEFAULT_NOTIFICATION_TREE], [], labels)).toEqual({ status: 'unknown' });
  });

  it('requires the default tree to be present', () => {
    expect(inspectNotificationRouting([routingTreeFactory.build()], contactPoints, labels)).toEqual({
      status: 'unknown',
    });
  });

  it('respects child policies even if the root destination is unconfigured', () => {
    const tree = treeWithRoutes([
      { matchers: [{ label: 'job', type: '=', value: 'checkout' }], receiver: 'Team X', continue: false },
    ]);
    expect(inspectNotificationRouting([tree], [UNCONFIGURED_NOTIFICATION_CONTACT_POINT, teamContact], labels)).toEqual(
      teamResult
    );
  });

  it('uses an inherited receiver when a matching child has no receiver', () => {
    const tree = treeWithRoutes([{ matchers: [{ label: 'job', type: '=', value: 'checkout' }], continue: false }]);
    expect(inspectNotificationRouting([tree], contactPoints, labels)).toEqual({
      ...defaultResult,
      usesDefaultPolicyOnly: false,
    });
  });

  it('uses the parent when no child matches and follows continue to other recipients', () => {
    const tree = treeWithRoutes([
      {
        receiver: 'Team X',
        continue: true,
        routes: [{ matchers: [{ label: 'job', type: '=', value: 'other' }], receiver: 'unused', continue: false }],
      },
      { continue: false },
    ]);
    expect(inspectNotificationRouting([tree], contactPoints, labels)).toEqual({
      status: 'configured',
      destinations: [...teamResult.destinations, ...defaultResult.destinations],
      usesDefaultPolicyOnly: false,
    });
  });

  it('stops matching siblings when continue is false', () => {
    const tree = treeWithRoutes([
      { receiver: 'Team X', continue: false },
      { receiver: 'unreadable', continue: false },
    ]);
    expect(inspectNotificationRouting([tree], contactPoints, labels)).toEqual(teamResult);
  });

  it.each([
    ['=~', 'check.*', 'checkout', true],
    ['!~', 'prod-.*', 'checkout', true],
    ['!~', 'check.*', 'checkout', false],
    ['=~', 'check', 'checkout', false],
    ['=~', 'checkout|payments', 'checkout-extra', false],
    ['=~', '(?i)CHECKOUT', 'checkout', true],
    ['=~', '^(?:checkout|payments)-[a-z]+$', 'checkout-prod', true],
    ['=~', 'check-[\\d]+', 'check-123', true],
    ['=~', 'check\\sout', 'check out', true],
    ['=~', 'checkout \\[5m\\]', 'checkout [5m]', true],
    ['=~', '(?i:CHECK)out', 'checkOUT', undefined],
    ['=~', 'check(?i)OUT', 'checkout', undefined],
    ['=~', '(?P<team>check)out', 'checkout', undefined],
    ['=~', '[[:alpha:]]+', 'checkout', undefined],
    ['=~', '\\p{Greek}+', 'αβ', undefined],
    ['=~', '\\Qcheckout\\E', 'checkout', undefined],
    ['=~', '[]]', ']', undefined],
    ['=~', '.', '😀', undefined],
    ['=~', '\\s', '\u00a0', undefined],
    ['=~', 'checkout', 'checkout\n', undefined],
    ['=~', '.*', 'check\nout', undefined],
    ['=~', '(?s).*', 'check\nout', undefined],
    ['=~', '.*', '', true],
    ['=~', '(a+)+', 'a'.repeat(28) + '!', undefined],
    ['!~', '(a|aa)+', 'a'.repeat(28) + '!', undefined],
    ['=~', 'a*a*a*a*a*a*b', 'a'.repeat(28) + '!', undefined],
    ['=~', '(a?){28}a{28}', 'a'.repeat(28), undefined],
    ['=~', '(a|aa)(a|aa)(a|aa)(a|aa)(a|aa)', 'a'.repeat(10), undefined],
    ['=~', 'a'.repeat(257), 'a', undefined],
    ['=~', 'a+', 'a'.repeat(513), undefined],
    ['=~', '[*+?{}]+', '*+?{}', true],
    ['=~', 'check\\+', 'check+', true],
  ] as const)(
    'previews job %s %s against %j only when the shared matcher is compatible',
    (type, value, job, matches) => {
      const tree = treeWithRoutes([{ matchers: [{ label: 'job', type, value }], receiver: 'Team X', continue: false }]);
      expect(inspectNotificationRouting([tree], contactPoints, { ...labels, job })).toEqual(
        matches === undefined ? { status: 'unknown' } : matches ? teamResult : defaultResult
      );
    }
  );

  it.each(['[', '(?=synthetic)synthetic_monitoring'])('does not interpret invalid regex %s as a non-match', (value) => {
    const tree = treeWithRoutes([
      {
        matchers: [{ label: 'namespace', type: '=~', value }],
        receiver: 'Team X',
        continue: false,
      },
    ]);
    expect(inspectNotificationRouting([tree], contactPoints, labels)).toEqual({ status: 'unknown' });
  });

  it('does not assume an unrepresented runtime label is absent from the real alert', () => {
    const tree = treeWithRoutes([
      { matchers: [{ label: 'alert_sensitivity', type: '=', value: 'high' }], receiver: 'Team X', continue: false },
    ]);
    expect(inspectNotificationRouting([tree], contactPoints, labels)).toEqual({ status: 'unknown' });
  });

  it('can ignore a regex branch excluded by an exact matcher on its parent', () => {
    const tree = treeWithRoutes([
      {
        matchers: [{ label: 'namespace', type: '!=', value: 'synthetic_monitoring' }],
        continue: false,
        routes: [{ matchers: [{ label: 'job', type: '=~', value: '.*' }], receiver: 'Team X', continue: false }],
      },
    ]);
    expect(inspectNotificationRouting([tree], contactPoints, labels)).toEqual(defaultResult);
  });

  it.each([false, true])('only inspects later siblings if continue is %s', (continueMatching) => {
    const tree = treeWithRoutes([
      {
        matchers: [{ label: 'job', type: '=~', value: 'check.*' }],
        receiver: 'Team X',
        continue: continueMatching,
      },
      { matchers: [{ label: 'runtime_label', type: '=', value: 'unknown' }], continue: false },
    ]);
    expect(inspectNotificationRouting([tree], contactPoints, labels)).toEqual(
      continueMatching ? { status: 'unknown' } : teamResult
    );
  });

  it('ignores unknown matchers and children when a regex excludes their branch', () => {
    const tree = treeWithRoutes([
      {
        matchers: [
          { label: 'runtime_label', type: '!=', value: '' },
          { label: 'job', type: '=~', value: 'payments.*' },
        ],
        continue: false,
        routes: [{ matchers: [{ label: 'job', type: '=~', value: '[' }], continue: false }],
      },
    ]);
    expect(inspectNotificationRouting([tree], contactPoints, labels)).toEqual(defaultResult);
  });
});
