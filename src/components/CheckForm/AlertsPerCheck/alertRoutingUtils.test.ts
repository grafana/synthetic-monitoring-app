import { USER_DEFINED_TREE_NAME } from '@grafana/alerting';

import { routingTreeFactory } from '../../../test/factories/routingTree';
import { getDefaultRoutingTree } from './alertRoutingUtils';

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
