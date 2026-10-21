import { USER_DEFINED_TREE_NAME } from '@grafana/alerting';

import { CheckAlertType, CheckType } from 'types';
import { LabelMode } from 'datasource/responses.types';

import { routingTreeFactory } from '../../../test/factories/routingTree';
import { generateAlertLabels, getDefaultRoutingTree } from './alertRoutingUtils';

describe('getDefaultRoutingTree', () => {
  const userDefinedTree = routingTreeFactory.build({ metadata: { name: USER_DEFINED_TREE_NAME } });
  const namedTreeA = routingTreeFactory.build({ metadata: { name: 'hashicorp-vault' } });
  const namedTreeB = routingTreeFactory.build({ metadata: { name: 'pam-incident-alert' } });

  it('returns the user-defined tree regardless of its position in the list', () => {
    const trees = [namedTreeA, userDefinedTree, namedTreeB];
    expect(getDefaultRoutingTree(trees)).toBe(userDefinedTree);
  });

  it('returns undefined when there is no user-defined tree', () => {
    expect(getDefaultRoutingTree([namedTreeA, namedTreeB])).toBeUndefined();
  });
});

it('uses the rule title with its period and gives rule labels precedence over unprefixed query labels', () => {
  const labels = generateAlertLabels(CheckAlertType.ProbeFailedExecutionsTooHigh, {
    checkType: CheckType.Http,
    frequency: 60000,
    job: 'checkout',
    instance: 'https://example.com',
    period: '5m',
    labelMode: LabelMode.Unprefixed,
    customLabels: [
      { name: 'namespace', value: 'other' },
      { name: 'team', value: 'payments' },
    ],
  });
  expect(labels).toMatchObject({
    namespace: 'synthetic_monitoring',
    alertname: 'ProbeFailedExecutionsTooHigh [5m]',
    team: 'payments',
  });
});

it('only includes the per-check routing label when supplied as a custom label', () => {
  const check = {
    checkType: CheckType.Http,
    frequency: 60000,
    job: 'checkout',
    instance: 'https://example.com',
    period: '5m',
    labelMode: LabelMode.Prefixed,
    customLabels: [],
  };
  expect(generateAlertLabels(CheckAlertType.ProbeFailedExecutionsTooHigh, check)).not.toHaveProperty(
    'label_per_check_alerts'
  );
  expect(
    generateAlertLabels(CheckAlertType.ProbeFailedExecutionsTooHigh, {
      ...check,
      customLabels: [{ name: 'per_check_alerts', value: 'true' }],
    })
  ).toHaveProperty('label_per_check_alerts', 'true');
});
