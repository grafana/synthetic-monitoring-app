import React from 'react';
import { render, screen } from '@testing-library/react';
import { InstanceContext } from 'components/InstanceContext';
import { getInstanceMock, instanceSettings } from '../datasource/__mocks__/DataSource';
import { UptimeGauge } from './UptimeGauge';
import * as utils from 'utils';

const renderUptimeGauge = (sparkline = false) => {
  const instance = {
    api: getInstanceMock(instanceSettings),
  };
  render(
    <InstanceContext.Provider value={{ instance, loading: false }}>
      <UptimeGauge
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
  renderUptimeGauge();
  const value = await screen.findByText('100.00%');
  expect(value).toBeInTheDocument();
});

test('shows N/A if no data', async () => {
  jest.spyOn(utils, 'queryMetric').mockImplementation(() => Promise.resolve({ data: [] }));
  renderUptimeGauge();
  const value = await screen.findByText('N/A');
  expect(value).toBeInTheDocument();
});
