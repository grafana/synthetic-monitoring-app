import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';

import { useTenant } from 'data/useTenant';

import { useLegacyAlertsRestriction } from './useLegacyAlertsRestriction';

jest.mock('data/useTenant');
const mockUseTenant = useTenant as jest.Mock;

describe('useLegacyAlertsRestriction', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  it('should return isRestricted as false when tenant data is not available', () => {
    mockUseTenant.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useLegacyAlertsRestriction(), { wrapper });

    expect(result.current.isRestricted).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return isRestricted as false when tenant created timestamp is not available', () => {
    mockUseTenant.mockReturnValue({
      data: { id: 1 },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useLegacyAlertsRestriction(), { wrapper });

    expect(result.current.isRestricted).toBe(false);
  });

  it('should return isRestricted as false for users created before the cutoff date', () => {
    // Date before 2025-10-15 (cutoff date in the hook)
    const oldTenantCreated = 1640995200; // 2022-01-01

    mockUseTenant.mockReturnValue({
      data: { id: 1, created: oldTenantCreated },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useLegacyAlertsRestriction(), { wrapper });

    expect(result.current.isRestricted).toBe(false);
    expect(result.current.tenantCreated).toBe(oldTenantCreated);
  });

  it('should return isRestricted as true for users created after the cutoff date', () => {
    // Date after 2025-10-15 (cutoff date in the hook)
    const newTenantCreated = 1760572800; // 2025-10-16 (one day after cutoff)

    mockUseTenant.mockReturnValue({
      data: { id: 1, created: newTenantCreated },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useLegacyAlertsRestriction(), { wrapper });

    expect(result.current.isRestricted).toBe(true);
    expect(result.current.tenantCreated).toBe(newTenantCreated);
  });
});
