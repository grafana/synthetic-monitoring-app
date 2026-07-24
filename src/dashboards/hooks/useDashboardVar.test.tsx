import React from 'react';
import { MemoryRouter } from 'react-router';
import { render, renderHook, screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { CheckDashboardProvider } from 'contexts/CheckDashboardProvider';
import { DashboardPanelScopeProvider } from 'contexts/DashboardPanelScopeProvider';

import { useDashboardVar, useDashboardVarProbes } from './useDashboardVar';

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

jest.mock('@grafana/scenes-react', () => ({
  useVariables: () => [],
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/checks/1']}>
      <CheckDashboardProvider check={BASIC_HTTP_CHECK} urlFormat="canonical">
        {children}
      </CheckDashboardProvider>
    </MemoryRouter>
  );
}

describe('useDashboardVar', () => {
  it('returns all probes when no probe filter is selected', () => {
    const { result } = renderHook(() => useDashboardVar('probe'), { wrapper });

    expect(result.current).toEqual(['.*']);
  });

  it('keeps header probes global while resolving selected probes inside panel scope', () => {
    function ProbeConsumer({ testId }: { testId: string }) {
      const raw = useDashboardVar('probe');
      const expanded = useDashboardVarProbes(BASIC_HTTP_CHECK);

      return (
        <output
          data-expanded={expanded.join(',')}
          data-raw={raw.join(',')}
          data-testid={testId}
        />
      );
    }

    render(
      <MemoryRouter initialEntries={['/checks/1?sm-v=1&sm-probe=frankfurt']}>
        <CheckDashboardProvider check={BASIC_HTTP_CHECK} urlFormat="canonical">
          <ProbeConsumer testId="header-query-scope" />
          <DashboardPanelScopeProvider>
            <ProbeConsumer testId="panel-query-scope" />
          </DashboardPanelScopeProvider>
        </CheckDashboardProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('header-query-scope')).toHaveAttribute('data-raw', '.*');
    expect(screen.getByTestId('header-query-scope')).toHaveAttribute('data-expanded', 'frankfurt,ohio');
    expect(screen.getByTestId('panel-query-scope')).toHaveAttribute('data-raw', 'frankfurt');
    expect(screen.getByTestId('panel-query-scope')).toHaveAttribute('data-expanded', 'frankfurt');
  });

  it('returns job and instance from the check', () => {
    const { result: job } = renderHook(() => useDashboardVar('job'), { wrapper });
    const { result: instance } = renderHook(() => useDashboardVar('instance'), { wrapper });

    expect(job.current).toEqual([BASIC_HTTP_CHECK.job]);
    expect(instance.current).toEqual([BASIC_HTTP_CHECK.target]);
  });
});
