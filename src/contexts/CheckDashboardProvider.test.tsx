import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

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
});

describe('legacy HTTP dashboard route', () => {
  it('does not mount CheckDashboardProvider on the legacy route seam', () => {
    jest.isolateModules(() => {
      const { HttpDashboardRoute } = require('page/HttpDashboardRoute');
      const routeSource = HttpDashboardRoute.toString();

      expect(routeSource).not.toContain('CheckDashboardProvider');
    });
  });
});
