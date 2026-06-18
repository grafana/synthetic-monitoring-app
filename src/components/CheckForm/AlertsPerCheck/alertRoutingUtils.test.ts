import { USER_DEFINED_TREE_NAME } from '@grafana/alerting';

import { getDefaultRoutingTree } from './alertRoutingUtils';

describe('getDefaultRoutingTree', () => {
  const userDefinedTree = { metadata: { name: USER_DEFINED_TREE_NAME } };
  const namedTreeA = { metadata: { name: 'hashicorp-vault' } };
  const namedTreeB = { metadata: { name: 'pam-incident-alert' } };

  it('returns the user-defined tree regardless of its position in the list', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trees = [namedTreeA, userDefinedTree, namedTreeB] as any;
    expect(getDefaultRoutingTree(trees)).toBe(userDefinedTree);
  });

  it('returns undefined when there is no user-defined tree', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getDefaultRoutingTree([namedTreeA, namedTreeB] as any)).toBeUndefined();
  });
});
