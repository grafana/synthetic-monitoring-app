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
    mockQueryLoki.mockResolvedValue([]);
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
});
