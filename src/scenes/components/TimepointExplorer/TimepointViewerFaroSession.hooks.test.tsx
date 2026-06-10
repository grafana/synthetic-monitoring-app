import React, { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import { useFaroSessionLink } from 'scenes/components/TimepointExplorer/TimepointViewerFaroSession.hooks';

const mockQueryLoki = jest.fn();

jest.mock('hooks/useLogsDS', () => ({
  useLogsDS: () => ({ uid: 'loki-uid' }),
}));

jest.mock('features/queryDatasources/queryLoki', () => ({
  queryLoki: (args: unknown) => mockQueryLoki(args),
}));

function createTestWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const from = 1700000000000;
const to = 1700000060000;

describe('useFaroSessionLink', () => {
  beforeEach(() => {
    mockQueryLoki.mockReset();
    mockQueryLoki.mockResolvedValue([]);
  });

  it('queries by exact execution id when one is provided', async () => {
    renderHook(
      () =>
        useFaroSessionLink({
          job: 'Daily Focus Studio Homepage',
          instance: 'daily-focus-studio',
          probe: 'probe-1',
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

  it('falls back to the legacy job/instance/probe matching when no execution id is present', async () => {
    renderHook(
      () =>
        useFaroSessionLink({
          job: 'Daily Focus Studio Homepage',
          instance: 'daily-focus-studio',
          probe: 'probe-1',
          from,
          to,
        }),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => expect(mockQueryLoki).toHaveBeenCalledTimes(1));

    const { query } = mockQueryLoki.mock.calls[0][0];
    expect(query).toContain('k6_testRunId=~`.*"job":"Daily Focus Studio Homepage".*`');
    expect(query).toContain('k6_testRunId=~`.*"instance":"daily-focus-studio".*`');
    expect(query).toContain('k6_testRunId=~`.*"probe":"probe-1".*`');
    expect(query).not.toContain('k6_testRunId="sm:');
  });

  it('queries by execution id even without job/instance/probe', async () => {
    renderHook(
      () =>
        useFaroSessionLink({
          job: '',
          instance: '',
          executionId: 'exec-456',
          from,
          to,
        }),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => expect(mockQueryLoki).toHaveBeenCalledTimes(1));

    const { query } = mockQueryLoki.mock.calls[0][0];
    expect(query).toContain('k6_testRunId="sm:exec-456"');
  });

  it('does not query when there is neither an execution id nor a probe', async () => {
    renderHook(() => useFaroSessionLink({ job: 'j', instance: 'i', from, to }), {
      wrapper: createTestWrapper(),
    });

    // Give react-query a tick to (not) fire.
    await new Promise((r) => setTimeout(r, 50));
    expect(mockQueryLoki).not.toHaveBeenCalled();
  });

  it('does not query when disabled', async () => {
    renderHook(
      () => useFaroSessionLink({ job: 'j', instance: 'i', probe: 'p', executionId: 'exec-1', from, to, enabled: false }),
      { wrapper: createTestWrapper() }
    );

    await new Promise((r) => setTimeout(r, 50));
    expect(mockQueryLoki).not.toHaveBeenCalled();
  });
});
