import { OrgRole } from 'types';
import * as utils from 'utils';

function hasRole(requiredRole: OrgRole): boolean {
  return true;
}

const queryMetric = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    data: [
      {
        metric: {},
        value: [1598535155, '1'],
      },
    ],
  });
});

module.exports = {
  ...utils,
  hasRole,
  queryMetric,
};
