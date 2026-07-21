import { QueryClient } from '@tanstack/react-query';

import { ResolvedQueryRequest } from './types';
import { getQueryClient, queryClient } from 'data/queryClient';

import { buildDashboardQueryKey, createDashboardQueryScope } from './dashboardQueryKeys';
import { createDashboardQueryOptions, invalidateDashboardScope } from './dashboardQueryOptions';

describe('dashboardQueryKeys', () => {
  it('builds stable keys for equivalent target descriptors', () => {
    const scope = createDashboardQueryScope('stack-a', 42);
    const request: ResolvedQueryRequest = {
      datasourceUid: 'prom-a',
      datasourceType: 'prometheus',
      targets: [{ refId: 'B', expr: 'up' }, { refId: 'A', expr: 'down' }],
      range: { from: 1, to: 2 },
      timezone: 'utc',
      interval: '30s',
      intervalMs: 30_000,
      maxDataPoints: 500,
      requestId: 'request-1',
    };

    const reversedTargets: ResolvedQueryRequest = {
      ...request,
      targets: [{ refId: 'A', expr: 'down' }, { refId: 'B', expr: 'up' }],
    };

    expect(buildDashboardQueryKey({ scope, request: reversedTargets })).toEqual(
      buildDashboardQueryKey({ scope, request })
    );
  });
});

describe('dashboardQueryOptions', () => {
  it('applies explicit stale time and scoped invalidation', async () => {
    const client = new QueryClient();
    const scope = createDashboardQueryScope('stack-a', 7);

    client.setQueryData([...scope, 'panel', 'uptime'], { value: 1 });

    await invalidateDashboardScope(client, scope);

    expect(client.getQueryState([...scope, 'panel', 'uptime'])?.isInvalidated).toBe(true);
  });

  it('creates query options with dashboard stale time', () => {
    const scope = createDashboardQueryScope('stack-a', 7);
    const options = createDashboardQueryOptions({
      scope,
      queryKey: ['panel', 'uptime'],
      queryFn: async () => ({ value: 1 }),
    });

    expect(options.staleTime).toBe(30_000);
    expect(options.queryKey).toEqual(['check-dashboard', 'stack-a', 7, 'panel', 'uptime']);
  });
});

describe('queryClient singleton', () => {
  it('is a shared in-memory client without persistence', () => {
    const first = getQueryClient();
    const second = getQueryClient();

    expect(first).not.toBe(second);
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(false);
    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(Number.POSITIVE_INFINITY);
  });
});
