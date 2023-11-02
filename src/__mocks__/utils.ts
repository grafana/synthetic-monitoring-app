import { OrgRole } from '@grafana/data';

import * as utils from 'utils';

function hasRole(requiredRole: OrgRole): boolean {
  return true;
}

const queryMetric = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    data: [
      {
        metric: {
          instance: 'tacos',
          job: 'burritos',
        },
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
