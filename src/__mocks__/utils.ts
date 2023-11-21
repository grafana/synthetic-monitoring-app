import * as utils from 'utils';

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
  queryMetric,
};
