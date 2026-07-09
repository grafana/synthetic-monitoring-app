import React, { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

import { CheckType } from 'types';
import { StatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  useCheckRumAvailability,
  useFaroSessionLink,
} from 'scenes/components/TimepointExplorer/TimepointViewerFaroSession.hooks';

const mockQueryLoki = jest.fn();
const mockParseLokiLogs = jest.fn();

jest.mock('hooks/useLogsDS', () => ({
  useLogsDS: () => ({ uid: 'loki-uid' }),
}));

jest.mock('features/queryDatasources/queryLoki', () => ({
  queryLoki: (args: unknown) => mockQueryLoki(args),
}));

jest.mock('features/parseLokiLogs/parseLokiLogs', () => ({
  parseLokiLogs: (frame: unknown) => mockParseLokiLogs(frame),
}));

function createTestWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  function TestWrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  return TestWrapper;
}

const from = 1700000000000;
const to = 1700000060000;

describe('useFaroSessionLink', () => {
  beforeEach(() => {
    mockQueryLoki.mockReset();
    mockParseLokiLogs.mockReset();
    mockQueryLoki.mockResolvedValue([]);
    mockParseLokiLogs.mockReturnValue([]);
  });

  it('queries by exact execution id', async () => {
    renderHook(
      () =>
        useFaroSessionLink({
          executionId: 'exec-123',
          from,
          to,
        }),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => expect(mockQueryLoki).toHaveBeenCalledTimes(1));

    const { query } = mockQueryLoki.mock.calls[0][0];
    expect(query).toBe(
      '{kind=~"event|measurement"} | logfmt | k6_isK6Browser="true" | k6_testRunId="sm:exec-123"'
    );
  });

  it('does not query when execution id is missing', async () => {
    renderHook(() => useFaroSessionLink({ executionId: '', from, to }), {
      wrapper: createTestWrapper(),
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockQueryLoki).not.toHaveBeenCalled();
  });

  it('does not query when disabled', async () => {
    renderHook(
      () => useFaroSessionLink({ executionId: 'exec-1', from, to, enabled: false }),
      { wrapper: createTestWrapper() }
    );

    await new Promise((r) => setTimeout(r, 50));
    expect(mockQueryLoki).not.toHaveBeenCalled();
  });

  it('surfaces Loki failures as an error instead of a successful empty result', async () => {
    mockQueryLoki.mockRejectedValue(new Error('loki timeout'));

    const { result } = renderHook(
      () =>
        useFaroSessionLink({
          executionId: 'exec-123',
          from,
          to,
        }),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
  });

  it('returns null data on a successful empty lookup', async () => {
    mockQueryLoki.mockResolvedValue([]);

    const { result } = renderHook(
      () =>
        useFaroSessionLink({
          executionId: 'exec-123',
          from,
          to,
        }),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it('invokes onSuccess with the session result when a Faro session is found', async () => {
    const onSuccess = jest.fn();
    mockQueryLoki.mockResolvedValue([{}]);
    mockParseLokiLogs.mockReturnValue([
      {
        labels: { app_id: '2', session_id: 'abc123' },
        timestamp: from,
        body: '',
        nanos: 0,
        labelTypes: {},
        id: '1',
      },
    ]);

    renderHook(
      () =>
        useFaroSessionLink({
          executionId: 'exec-123',
          from,
          to,
          onSuccess,
        }),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onSuccess).toHaveBeenCalledWith({
      appId: '2',
      sessionId: 'abc123',
      href: '/a/grafana-kowalski-app/apps/2/sessions/abc123',
    });
  });

  it('invokes onSuccess with null when the lookup succeeds empty', async () => {
    const onSuccess = jest.fn();

    renderHook(
      () =>
        useFaroSessionLink({
          executionId: 'exec-123',
          from,
          to,
          onSuccess,
        }),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(null));
  });

  it('does not invoke onSuccess when the lookup errors', async () => {
    const onSuccess = jest.fn();
    mockQueryLoki.mockRejectedValue(new Error('loki timeout'));

    const { result } = renderHook(
      () =>
        useFaroSessionLink({
          executionId: 'exec-123',
          from,
          to,
          onSuccess,
        }),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('keeps the previous session while a new execution id is fetching', async () => {
    mockQueryLoki.mockResolvedValueOnce([{}]);
    mockParseLokiLogs.mockReturnValueOnce([
      {
        labels: { app_id: '2', session_id: 'abc123' },
        timestamp: from,
        body: '',
        nanos: 0,
        labelTypes: {},
        id: '1',
      },
    ]);

    let executionId = 'exec-1';
    const { result, rerender } = renderHook(
      () =>
        useFaroSessionLink({
          executionId,
          from,
          to,
        }),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => expect(result.current.data?.sessionId).toBe('abc123'));

    let resolveSecond: (value: unknown) => void = () => undefined;
    mockQueryLoki.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSecond = resolve;
      })
    );

    executionId = 'exec-2';
    rerender();

    await waitFor(() => expect(mockQueryLoki).toHaveBeenCalledTimes(2));
    expect(result.current.isFetching).toBe(true);
    expect(result.current.data?.sessionId).toBe('abc123');

    resolveSecond([]);
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(result.current.data).toBeNull();
  });
});

describe('useCheckRumAvailability', () => {
  const listLogsMap: Record<number, StatefulTimepoint> = {
    [from]: {
      adjustedTime: from,
      timepointDuration: 1000,
      status: 'success',
      index: 0,
      config: { frequency: 60000, from, to },
      maxProbeDuration: 1000,
      probeResults: {
        probeA: [{ labels: { execution_id: 'exec-1' } } as StatefulTimepoint['probeResults'][string][number]],
      },
    },
  };

  beforeEach(() => {
    mockQueryLoki.mockReset();
    mockParseLokiLogs.mockReset();
    mockQueryLoki.mockResolvedValue([]);
    mockParseLokiLogs.mockReturnValue([]);
  });

  it('does not probe for non-browser checks', async () => {
    renderHook(
      () =>
        useCheckRumAvailability({
          checkType: CheckType.Http,
          listLogsMap,
        }),
      { wrapper: createTestWrapper() }
    );

    await new Promise((r) => setTimeout(r, 50));
    expect(mockQueryLoki).not.toHaveBeenCalled();
  });

  it('probes with an OR of execution ids and marks present when logs exist', async () => {
    mockQueryLoki.mockResolvedValue([{}]);
    mockParseLokiLogs.mockReturnValue([{ labels: { app_id: '2', session_id: 'abc' } }]);

    const { result } = renderHook(
      () =>
        useCheckRumAvailability({
          checkType: CheckType.Browser,
          listLogsMap,
        }),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => expect(result.current.rumAvailability).toBe('present'));
    expect(mockQueryLoki.mock.calls[0][0].query).toContain('k6_testRunId=~"sm:(exec-1)"');
  });

  it('marks absent when the probe returns no logs', async () => {
    mockQueryLoki.mockResolvedValue([]);
    mockParseLokiLogs.mockReturnValue([]);

    const { result } = renderHook(
      () =>
        useCheckRumAvailability({
          checkType: CheckType.Browser,
          listLogsMap,
        }),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => expect(result.current.rumAvailability).toBe('absent'));
  });

  it('leaves availability unknown when the probe errors', async () => {
    mockQueryLoki.mockRejectedValue(new Error('timeout'));

    const { result } = renderHook(
      () =>
        useCheckRumAvailability({
          checkType: CheckType.Browser,
          listLogsMap,
        }),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => expect(mockQueryLoki).toHaveBeenCalled());
    expect(result.current.rumAvailability).toBe('unknown');
  });

  it('promotes to present via markRumPresent even after an absent probe', async () => {
    mockQueryLoki.mockResolvedValue([]);
    mockParseLokiLogs.mockReturnValue([]);

    const { result } = renderHook(
      () =>
        useCheckRumAvailability({
          checkType: CheckType.Browser,
          listLogsMap,
        }),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => expect(result.current.rumAvailability).toBe('absent'));
    act(() => {
      result.current.markRumPresent();
    });
    await waitFor(() => expect(result.current.rumAvailability).toBe('present'));
  });
});
