import { renderHook, waitFor } from '@testing-library/react';
import { HTTP_RELIABILITY_SUGGESTION } from 'test/fixtures/reliabilityInbox';
import { createWrapper } from 'test/render';

import { getQueryClient } from 'data/queryClient';
import { useSMDS } from 'hooks/useSMDS';

import { reliabilityInboxQueryKey, useCachedReliabilityInboxSuggestions, useReliabilityInboxSuggestions } from './data';

jest.mock('hooks/useSMDS', () => ({
  useSMDS: jest.fn(),
}));

const API_HOST = 'https://synthetic-monitoring-api-dev.grafana-dev.net';
const getReliabilityInboxSuggestions = jest.fn();

describe('Reliability Inbox data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useSMDS).mockReturnValue({
      uid: undefined,
      instanceSettings: { jsonData: { apiHost: API_HOST } },
      supportsReliabilityInbox: () => true,
      getReliabilityInboxSuggestions,
      getMetricsDS: () => undefined,
      getLogsDS: () => undefined,
    } as unknown as ReturnType<typeof useSMDS>);
    getReliabilityInboxSuggestions.mockResolvedValue({ suggestions: [] });
  });

  it('does not generate suggestions when only the cache is observed', async () => {
    const queryClient = getQueryClient();
    const { Wrapper } = createWrapper({ queryClient });
    const { result } = renderHook(() => useCachedReliabilityInboxSuggestions(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe('idle');
    expect(getReliabilityInboxSuggestions).not.toHaveBeenCalled();
  });

  it('returns generated suggestions from the cache without another service call', async () => {
    const queryClient = getQueryClient();
    const { Wrapper } = createWrapper({ queryClient });
    queryClient.setQueryData(reliabilityInboxQueryKey(API_HOST), []);

    const { result } = renderHook(() => useCachedReliabilityInboxSuggestions(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.data).toEqual([]);
    expect(getReliabilityInboxSuggestions).not.toHaveBeenCalled();
  });

  it('generates suggestions when the active page hook is mounted', async () => {
    const queryClient = getQueryClient();
    const { Wrapper } = createWrapper({ queryClient });
    getReliabilityInboxSuggestions.mockResolvedValue({
      suggestions: [
        { ...HTTP_RELIABILITY_SUGGESTION, id: 'lower-relevance', relevance: 20 },
        HTTP_RELIABILITY_SUGGESTION,
      ],
    });
    const { result } = renderHook(() => useReliabilityInboxSuggestions(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getReliabilityInboxSuggestions).toHaveBeenCalledTimes(1);
    expect(result.current.data?.map(({ id }) => id)).toEqual(['http-suggestion', 'lower-relevance']);
    expect(queryClient.getQueryData(reliabilityInboxQueryKey(API_HOST))).toEqual(result.current.data);
  });
});
