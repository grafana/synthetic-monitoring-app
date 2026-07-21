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
});

describe('scene-free HTTP dashboard route', () => {
  it('mounts CheckDashboardProvider on the scene-free dashboard', () => {
    jest.isolateModules(() => {
      const { SceneFreeHttpDashboard } = require('dashboards/http/SceneFreeHttpDashboard');
      const routeSource = SceneFreeHttpDashboard.toString();

      expect(routeSource).toContain('CheckDashboardProvider');
    });
  });
});
