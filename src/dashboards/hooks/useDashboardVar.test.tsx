import React from 'react';
import { MemoryRouter } from 'react-router';
import { renderHook } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { CheckDashboardProvider } from 'contexts/CheckDashboardProvider';

import { useDashboardVar } from './useDashboardVar';

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

  it('returns job and instance from the check', () => {
    const { result: job } = renderHook(() => useDashboardVar('job'), { wrapper });
    const { result: instance } = renderHook(() => useDashboardVar('instance'), { wrapper });

    expect(job.current).toEqual([BASIC_HTTP_CHECK.job]);
    expect(instance.current).toEqual([BASIC_HTTP_CHECK.target]);
  });
});
