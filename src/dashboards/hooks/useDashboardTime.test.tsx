import React from 'react';
import { MemoryRouter } from 'react-router';
import { renderHook } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { AppTimeProvider } from 'contexts/AppTimeProvider';
import { CheckDashboardProvider } from 'contexts/CheckDashboardProvider';

import { useDashboardTime } from './useDashboardTime';

jest.mock('hooks/useFeatureFlag', () => ({
  useFeatureFlag: () => ({ isEnabled: true, isReady: true }),
}));

jest.mock('data/useProbes', () => ({
  useProbes: () => ({ data: [], isLoading: false, isError: false }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/checks/1?sm-from=now-6h&sm-to=now']}>
      <AppTimeProvider>
        <CheckDashboardProvider check={BASIC_HTTP_CHECK} urlFormat="canonical">
          {children}
        </CheckDashboardProvider>
      </AppTimeProvider>
    </MemoryRouter>
  );
}

describe('useDashboardTime', () => {
  it('returns AppTime-backed range when CheckDashboardProvider is mounted', () => {
    const { result } = renderHook(() => useDashboardTime(), { wrapper });

    expect(result.current.raw).toEqual({ from: 'now-6h', to: 'now' });
    expect(result.current.from.valueOf()).toBeLessThan(result.current.to.valueOf());
  });

  it('keeps an unchanged time range stable across provider renders', () => {
    const { result, rerender } = renderHook(() => useDashboardTime(), { wrapper });
    const initialRange = result.current;

    rerender();

    expect(result.current).toBe(initialRange);
  });
});
