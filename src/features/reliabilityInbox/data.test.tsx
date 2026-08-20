import { DataFrame } from '@grafana/data';
import { act, renderHook, waitFor } from '@testing-library/react';
import { METRICS_DATASOURCE } from 'test/fixtures/datasources';
import { HTTP_RELIABILITY_SUGGESTION } from 'test/fixtures/reliabilityInbox';
import { createWrapper } from 'test/render';

import { getQueryClient } from 'data/queryClient';
import { useSMDS } from 'hooks/useSMDS';

import {
  queryRecommendationTelemetry,
  reliabilityInboxDismissalsKey,
  reliabilityInboxQueryKey,
  reliabilityInboxStorageKey,
  useCachedReliabilityInboxSuggestions,
  useReliabilityInboxDismissals,
  useReliabilityInboxSuggestions,
} from './data';
import { getRecommendationTelemetryProvenance } from './evidence';

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
    const savedAt = Date.now();
    window.localStorage.setItem(
      reliabilityInboxStorageKey(API_HOST, STACK_ID),
      JSON.stringify({ savedAt, suggestions: [HTTP_RELIABILITY_SUGGESTION] })
    );
    const queryClient = getQueryClient();
    const { Wrapper } = createWrapper({ queryClient });

    const { result } = renderHook(() => useCachedReliabilityInboxSuggestions(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data?.[0].subject).toBe('mcp.goagain.dev'));
    expect(result.current.dataUpdatedAt).toBe(savedAt);
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

  it('exposes dismissed suggestions only when the review page opts in', async () => {
    window.localStorage.setItem(
      reliabilityInboxStorageKey(API_HOST, STACK_ID),
      JSON.stringify({ savedAt: Date.now(), suggestions: [HTTP_RELIABILITY_SUGGESTION] })
    );
    window.localStorage.setItem(
      reliabilityInboxDismissalsKey(API_HOST, STACK_ID),
      JSON.stringify([HTTP_RELIABILITY_SUGGESTION.id])
    );
    const queryClient = getQueryClient();
    const { Wrapper } = createWrapper({ queryClient });

    const { result } = renderHook(
      () => ({
        cached: useCachedReliabilityInboxSuggestions(),
        review: useReliabilityInboxSuggestions({ includeDismissed: true }),
      }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.review.data).toHaveLength(1));
    expect(result.current.cached.data).toEqual([]);
    expect(result.current.review.data?.[0].id).toBe('http-suggestion');
    expect(getReliabilityInboxSuggestions).not.toHaveBeenCalled();
  });

  it('keeps a stale saved snapshot when its background refresh degrades', async () => {
    const storageKey = reliabilityInboxStorageKey(API_HOST, STACK_ID);
    const savedAt = Date.now() - 7 * 60 * 60 * 1000;
    window.localStorage.setItem(storageKey, JSON.stringify({ savedAt, suggestions: [HTTP_RELIABILITY_SUGGESTION] }));
    getReliabilityInboxSuggestions.mockResolvedValue({ suggestions: [], warnings: ['telemetry unavailable'] });
    const queryClient = getQueryClient();
    const { Wrapper } = createWrapper({ queryClient });

    const { result } = renderHook(() => useReliabilityInboxSuggestions(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data?.[0].subject).toBe('mcp.goagain.dev');
    expect(result.current.dataUpdatedAt).toBe(savedAt);
    expect(JSON.parse(window.localStorage.getItem(storageKey)!)).toEqual({
      savedAt,
      suggestions: [HTTP_RELIABILITY_SUGGESTION],
    });
  });

  it('preserves provenance ref IDs and uses a short window for inline trends', () => {
    const provenance = getRecommendationTelemetryProvenance({
      ...HTTP_RELIABILITY_SUGGESTION.evidence,
      provenance: {
        datasource: 'prometheus-uid',
        range: { from: '1784800800000', to: '1784804400000' },
        queries: [
          { refId: 'A', expr: 'sum(rate(http_requests_total[1h]))' },
          { refId: 'C', expr: 'histogram_quantile(0.99, sum(rate(http_request_duration_bucket[1h])))' },
        ],
      },
    });

    expect(provenance?.queries).toEqual([
      {
        refId: 'A',
        expr: 'sum(rate(http_requests_total[5m]))',
        instant: false,
        range: true,
      },
      {
        refId: 'C',
        expr: 'histogram_quantile(0.99, sum(rate(http_request_duration_bucket[5m])))',
        instant: false,
        range: true,
      },
    ]);
  });

  it('runs inline trends against the configured Synthetic Monitoring metrics datasource', async () => {
    const frame = { refId: 'A' } as DataFrame;
    const executeQuery = jest.fn().mockResolvedValue({ A: [frame] });

    const result = await queryRecommendationTelemetry(
      HTTP_RELIABILITY_SUGGESTION.evidence,
      METRICS_DATASOURCE,
      executeQuery
    );

    expect(executeQuery).toHaveBeenCalledWith({
      start: 1784800800000,
      end: 1784804400000,
      queries: [
        expect.objectContaining({
          refId: 'A',
          interval: '1m',
          intervalMs: 60_000,
          maxDataPoints: 120,
          datasource: { uid: METRICS_DATASOURCE.uid, type: METRICS_DATASOURCE.type },
        }),
      ],
    });
    expect(result).toEqual([frame]);
  });
});
