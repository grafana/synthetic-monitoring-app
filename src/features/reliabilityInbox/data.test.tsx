import React, { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import { useSMDS } from 'hooks/useSMDS';

import { reliabilityInboxQueryKey, useCachedReliabilityInboxSuggestions, useReliabilityInboxSuggestions } from './data';

jest.mock('hooks/useSMDS', () => ({
  useSMDS: jest.fn(),
}));

const API_HOST = 'https://synthetic-monitoring-api-dev.grafana-dev.net';
const getReliabilityInboxSuggestions = jest.fn();

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('Reliability Inbox data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useSMDS).mockReturnValue({
      instanceSettings: { jsonData: { apiHost: API_HOST } },
      supportsReliabilityInbox: () => true,
      getReliabilityInboxSuggestions,
    } as unknown as ReturnType<typeof useSMDS>);
    getReliabilityInboxSuggestions.mockResolvedValue({ suggestions: [] });
  });

  it('does not generate suggestions when only the cache is observed', () => {
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useCachedReliabilityInboxSuggestions(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe('idle');
    expect(getReliabilityInboxSuggestions).not.toHaveBeenCalled();
  });

  it('returns generated suggestions from the cache without another service call', () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(reliabilityInboxQueryKey(API_HOST), []);

    const { result } = renderHook(() => useCachedReliabilityInboxSuggestions(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.data).toEqual([]);
    expect(getReliabilityInboxSuggestions).not.toHaveBeenCalled();
  });

  it('generates suggestions when the active page hook is mounted', async () => {
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useReliabilityInboxSuggestions(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getReliabilityInboxSuggestions).toHaveBeenCalledTimes(1);
  });
});
