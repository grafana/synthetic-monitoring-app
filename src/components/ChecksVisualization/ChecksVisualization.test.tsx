import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { ChecksVisualization } from './ChecksVisualization';
import { getInstanceMock } from 'datasource/__mocks__/DataSource';
import userEvent from '@testing-library/user-event';
import { InstanceContext } from 'contexts/InstanceContext';
import { AppPluginMeta } from '@grafana/data';
import { Check, GlobalSettings } from 'types';
import { SuccessRateContextProvider } from 'components/SuccessRateContextProvider';
jest.setTimeout(20000);
jest.mock('components/Autosizer');

interface RenderArgs {
  checks?: Check[];
}

const defaultChecks = [
  {
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
  },
  {
    id: 1,
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
    target: 'nachos.com',
    job: 'burritos',
    created: 1597928913.872104,
    modified: 1597928913.872104,
  },
  {
    id: 3,
    tenantId: 1,
    frequency: 60000,
    offset: 0,
    timeout: 2500,
    enabled: true,
    labels: [
      {
        name: 'carne',
        value: 'asada',
      },
    ],
    settings: {
      http: {
        ipVersion: 'V4',
        dontFragment: false,
      },
    },
    probes: [1],
    target: 'example.com',
    job: 'chimichurri',
    created: 1597928965.8595479,
    modified: 1597928965.8595479,
  },
  {
    id: 4,
    tenantId: 1,
    frequency: 60000,
    offset: 0,
    timeout: 2500,
    enabled: false,
    labels: [
      {
        name: 'agreat',
        value: 'label',
      },
    ],
    settings: {
      ping: {
        ipVersion: 'V4',
        dontFragment: false,
      },
    },
    probes: [1],
    target: 'grafana.com',
    job: 'test3',
    created: 1597934254.494585,
  },
] as Check[];

const renderChecksViz = ({ checks = defaultChecks }: RenderArgs = {}) => {
  const instance = getInstanceMock();
  const meta = {} as AppPluginMeta<GlobalSettings>;
  render(
    <InstanceContext.Provider value={{ instance: { api: instance }, loading: false, meta }}>
      <SuccessRateContextProvider checks={checks}>
        <div style={{ height: '500px', width: '500px' }}>
          <ChecksVisualization checks={checks} showIcons />
        </div>
      </SuccessRateContextProvider>
    </InstanceContext.Provider>
  );
};

test('renders viz', async () => {
  renderChecksViz();
  const checks = await screen.findAllByTestId('viz-hexagon');
  expect(checks.length).toBe(4);
});

test('handles no checks', async () => {
  await act(async () => {
    await renderChecksViz({ checks: [] });
  });
  const checks = await screen.queryAllByTestId('viz-hexagon');
  expect(checks.length).toBe(0);
});

test('shows tooltip on hover', async () => {
  renderChecksViz();
  const checks = await screen.findAllByTestId('viz-hexagon');
  userEvent.hover(checks[0]);
  const check1 = await screen.findByText(defaultChecks[0].job);
  expect(check1).toBeInTheDocument();
  userEvent.hover(checks[1]);
  const check2 = await screen.findByText(defaultChecks[1].job);
  expect(check2).toBeInTheDocument();
});
