import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { CheckHealth } from './CheckHealth';
import { InstanceContext } from './InstanceContext';
import { Check, GlobalSettings } from 'types';
import { getInstanceMock, instanceSettings } from '../datasource/__mocks__/DataSource';
import { AppPluginMeta } from '@grafana/data';

const defaultCheck = {
  basicMetricsOnly: true,
  id: 2,
  tenantId: 1,
  frequency: 60000,
  offset: 0,
  timeout: 2500,
  enabled: true,
  labels: [],
  settings: {
    ping: {
      ipVersion: 'V4',
      dontFragment: false,
    },
  },
  probes: [1],
  target: 'grafana.com',
  job: 'tacos',
  created: 1597928927.7490728,
  modified: 1597928927.7490728,
} as Check;

const renderCheckHealth = (check: Check = defaultCheck) => {
  const instance = {
    api: getInstanceMock(instanceSettings),
  };
  const meta = {} as AppPluginMeta<GlobalSettings>;
  return render(
    <InstanceContext.Provider value={{ instance, loading: false, meta }}>
      <CheckHealth check={check} />
    </InstanceContext.Provider>
  );
};

test('renders without crashing', async () => {
  const { container } = renderCheckHealth();
  const icon = container.querySelector('svg');
  // should have a paused icon while loading
  expect(icon).toHaveClass('alert-state-paused');
  await waitFor(() => {
    // should turn to a green heart when data has loaded
    const heartIcon = container.querySelector('svg');
    expect(heartIcon).toHaveClass('alert-state-ok');
  });
});
