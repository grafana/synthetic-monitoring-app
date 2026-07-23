import React from 'react';
import { MemoryRouter } from 'react-router';
import { render, screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { CheckDashboardProvider, useCheckDashboard } from './CheckDashboardProvider';

jest.mock('data/useProbes', () => ({
  useProbes: () => ({
    data: [
      { id: 1, name: 'frankfurt' },
      { id: 2, name: 'ohio' },
    ],
    isLoading: false,
    isError: false,
  }),
}));

function ProbeConsumer() {
  const { probes } = useCheckDashboard();

  return <div data-testid="probes">{probes.join(',')}</div>;
}

describe('CheckDashboardProvider', () => {
  it('exposes configured probe names from the probe catalog', () => {
    render(
      <MemoryRouter>
        <CheckDashboardProvider check={BASIC_HTTP_CHECK}>
          <ProbeConsumer />
        </CheckDashboardProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('probes')).toBeInTheDocument();
  });

  it('defaults to all probes when the URL has no probe filter', () => {
    render(
      <MemoryRouter initialEntries={['/checks/1']}>
        <CheckDashboardProvider check={BASIC_HTTP_CHECK} urlFormat="canonical">
          <ProbeConsumer />
        </CheckDashboardProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('probes')).toHaveTextContent('');
  });

  it('reads selected probes from the canonical URL', () => {
    render(
      <MemoryRouter initialEntries={['/checks/1?sm-v=1&sm-probe=frankfurt']}>
        <CheckDashboardProvider check={BASIC_HTTP_CHECK} urlFormat="canonical">
          <ProbeConsumer />
        </CheckDashboardProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('probes')).toHaveTextContent('frankfurt');
  });
});

describe('HTTP dashboard route', () => {
  it('mounts CheckDashboardProvider on the HTTP dashboard', () => {
    jest.isolateModules(() => {
      const { HTTPDashboard } = require('dashboards/http/HTTPDashboard');
      const routeSource = HTTPDashboard.toString();

      expect(routeSource).toContain('CheckDashboardProvider');
    });
  });
});
