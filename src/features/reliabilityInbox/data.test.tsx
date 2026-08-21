import { act, renderHook, waitFor } from '@testing-library/react';
import { HTTP_RELIABILITY_SUGGESTION } from 'test/fixtures/reliabilityInbox';
import { createWrapper } from 'test/render';

import { getQueryClient } from 'data/queryClient';
import { useSMDS } from 'hooks/useSMDS';

import {
  reliabilityInboxDismissalsKey,
  reliabilityInboxQueryKey,
  reliabilityInboxStorageKey,
  useCachedReliabilityInboxSuggestions,
  useReliabilityInboxDismissals,
  useReliabilityInboxSuggestions,
} from './data';

jest.mock('hooks/useSMDS', () => ({
  useSMDS: jest.fn(),
}));

const API_HOST = 'https://synthetic-monitoring-api-dev.grafana-dev.net';
const STACK_ID = 15629;
const getReliabilityInboxSuggestions = jest.fn();

describe('Reliability Inbox data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    jest.mocked(useSMDS).mockReturnValue({
      uid: undefined,
      instanceSettings: { jsonData: { apiHost: API_HOST, metrics: { hostedId: STACK_ID } } },
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
    queryClient.setQueryData(reliabilityInboxQueryKey(API_HOST, STACK_ID), []);

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
    expect(queryClient.getQueryData(reliabilityInboxQueryKey(API_HOST, STACK_ID))).toEqual(result.current.data);
    expect(
      JSON.parse(window.localStorage.getItem(reliabilityInboxStorageKey(API_HOST, STACK_ID))!).suggestions.map(
        ({ id }: { id: string }) => id
      )
    ).toEqual(['lower-relevance', 'http-suggestion']);
  });

  it('returns a saved browser snapshot without generating suggestions', async () => {
    window.localStorage.setItem(
      reliabilityInboxStorageKey(API_HOST, STACK_ID),
      JSON.stringify({ savedAt: Date.now(), suggestions: [HTTP_RELIABILITY_SUGGESTION] })
    );
    const queryClient = getQueryClient();
    const { Wrapper } = createWrapper({ queryClient });

    const { result } = renderHook(() => useCachedReliabilityInboxSuggestions(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data?.[0].subject).toBe('mcp.goagain.dev'));
    expect(getReliabilityInboxSuggestions).not.toHaveBeenCalled();
  });

  it('persists dismissed suggestions, filters them from cache, and supports undo', async () => {
    const dismissalsKey = reliabilityInboxDismissalsKey(API_HOST, STACK_ID);
    window.localStorage.setItem(
      reliabilityInboxStorageKey(API_HOST, STACK_ID),
      JSON.stringify({ savedAt: Date.now(), suggestions: [HTTP_RELIABILITY_SUGGESTION] })
    );
    window.localStorage.setItem(dismissalsKey, JSON.stringify([HTTP_RELIABILITY_SUGGESTION.id]));
    const queryClient = getQueryClient();
    const { Wrapper } = createWrapper({ queryClient });

    const { result } = renderHook(
      () => ({ suggestions: useCachedReliabilityInboxSuggestions(), dismissals: useReliabilityInboxDismissals() }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.suggestions.data).toEqual([]));
    act(() => result.current.dismissals.restoreSuggestion(HTTP_RELIABILITY_SUGGESTION.id));
    expect(result.current.suggestions.data).toHaveLength(1);
    act(() => result.current.dismissals.dismissSuggestion(HTTP_RELIABILITY_SUGGESTION.id));
    expect(result.current.suggestions.data).toEqual([]);
    expect(JSON.parse(window.localStorage.getItem(dismissalsKey)!)).toEqual([HTTP_RELIABILITY_SUGGESTION.id]);
    expect(getReliabilityInboxSuggestions).not.toHaveBeenCalled();
  });

  it('keeps a stale saved snapshot when its background refresh degrades', async () => {
    const storageKey = reliabilityInboxStorageKey(API_HOST, STACK_ID);
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ savedAt: Date.now() - 7 * 60 * 60 * 1000, suggestions: [HTTP_RELIABILITY_SUGGESTION] })
    );
    getReliabilityInboxSuggestions.mockResolvedValue({ suggestions: [], warnings: ['telemetry unavailable'] });
    const queryClient = getQueryClient();
    const { Wrapper } = createWrapper({ queryClient });

    const { result } = renderHook(() => useReliabilityInboxSuggestions(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data?.[0].subject).toBe('mcp.goagain.dev');
    expect(JSON.parse(window.localStorage.getItem(storageKey)!).suggestions).toEqual([HTTP_RELIABILITY_SUGGESTION]);
  });
});
