import React from 'react';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { InstanceContext } from 'contexts/InstanceContext';
import { getInstanceMock, instanceSettings } from '../datasource/__mocks__/DataSource';
import { SuccessRateGauge } from './SuccessRateGauge';
import * as utils from 'utils';
import { AppPluginMeta } from '@grafana/data';
import { Check, GlobalSettings } from 'types';
import { SuccessRateTypes } from 'contexts/SuccessRateContext';
import { SuccessRateContextProvider } from './SuccessRateContextProvider';

const renderSuccessRateGauge = (sparkline = false) => {
  const instance = {
    api: getInstanceMock(instanceSettings),
  };
  const meta = {} as AppPluginMeta<GlobalSettings>;
  render(
    <InstanceContext.Provider value={{ instance, loading: true, meta }}>
      <SuccessRateContextProvider checks={[{ id: 4, job: 'burritos', target: 'tacos' } as Check]}>
        <SuccessRateGauge
          id={4}
          type={SuccessRateTypes.Checks}
          labelNames={['tacos']}
          labelValues={['burritos']}
          height={200}
          width={200}
          sparkline={sparkline}
          onClick={jest.fn()}
        />
      </SuccessRateContextProvider>
    </InstanceContext.Provider>
  );
};

test('shows a value if data', async () => {
  renderSuccessRateGauge();
  await waitForElementToBeRemoved(() => screen.queryByText('loading...'));
  const value = await screen.findByText('100.00%');
  expect(value).toBeInTheDocument();
});

test('shows N/A if no data', async () => {
  jest.spyOn(utils, 'queryMetric').mockImplementation(() =>
    Promise.resolve({
      data: [
        {
          metric: {
            job: 'burritos',
            instance: 'tacos',
          },
          value: [],
        },
      ],
    })
  );
  renderSuccessRateGauge();
  await waitForElementToBeRemoved(() => screen.queryByText('loading...'));
  const value = await screen.findByText('N/A');
  expect(value).toBeInTheDocument();
});
