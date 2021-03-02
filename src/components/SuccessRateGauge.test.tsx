import React from 'react';
import { render, screen } from '@testing-library/react';
import { InstanceContext } from 'components/InstanceContext';
import { getInstanceMock, instanceSettings } from '../datasource/__mocks__/DataSource';
import { SuccessRateGauge } from './SuccessRateGauge';
import * as utils from 'utils';
import { AppPluginMeta } from '@grafana/data';
import { GlobalSettings } from 'types';

const renderSuccessRateGauge = (sparkline = false) => {
  const instance = {
    api: getInstanceMock(instanceSettings),
  };
  const meta = {} as AppPluginMeta<GlobalSettings>;
  render(
    <InstanceContext.Provider value={{ instance, loading: false, meta }}>
      <SuccessRateGauge
        labelNames={['tacos']}
        labelValues={['burritos']}
        height={200}
        width={200}
        sparkline={sparkline}
        onClick={jest.fn()}
      />
    </InstanceContext.Provider>
  );
};

test('shows a value if data', async () => {
  renderSuccessRateGauge();
  const value = await screen.findByText('100.00%');
  expect(value).toBeInTheDocument();
});

test('shows N/A if no data', async () => {
  jest.spyOn(utils, 'queryMetric').mockImplementation(() => Promise.resolve({ data: [] }));
  renderSuccessRateGauge();
  const value = await screen.findByText('N/A');
  expect(value).toBeInTheDocument();
});
