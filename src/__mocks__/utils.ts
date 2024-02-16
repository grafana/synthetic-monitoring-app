import { BASIC_CHECK_LIST } from 'test/fixtures/checks';

import * as utils from 'utils';

const metrics = BASIC_CHECK_LIST.map((check) => ({
  metric: {
    instance: check.target,
    job: check.job,
  },
  value: [1598535155, '1'],
}));

const queryMetric = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    data: metrics,
  });
});

module.exports = {
  ...utils,
  queryMetric,
};
