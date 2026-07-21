import { Observable } from 'rxjs';

import { createValueFrame } from './types';

import { executeQueries } from './executeQueries';

describe('executeQueries', () => {
  it('returns partial frames when a target reports an error', async () => {
    const controller = new AbortController();
    const result = await executeQueries({
      signal: controller.signal,
      requests: [
        {
          datasourceUid: 'prom-a',
          datasourceType: 'prometheus',
          requestId: 'request-1',
          range: { from: 1, to: 2 },
          timezone: 'utc',
          interval: '30s',
          intervalMs: 30_000,
          maxDataPoints: 500,
          targets: [{ refId: 'A', expr: 'up' }],
        },
      ],
      getDataSource: async () => ({
        query: async () => ({
          data: [createValueFrame('A', 1)],
          errors: [{ refId: 'B', message: 'target failed' }],
        }),
      }),
    });

    expect(result.aborted).toBe(false);
    expect(result.results[0]?.frames[0]?.fields[0]?.name).toBe('Value #A');
    expect(result.results[0]?.errors).toEqual([{ refId: 'B', message: 'target failed' }]);
  });

  it('returns a fatal error when no frames are available', async () => {
    const controller = new AbortController();
    const result = await executeQueries({
      signal: controller.signal,
      requests: [
        {
          datasourceUid: 'prom-a',
          datasourceType: 'prometheus',
          requestId: 'request-1',
          range: { from: 1, to: 2 },
          timezone: 'utc',
          interval: '30s',
          intervalMs: 30_000,
          maxDataPoints: 500,
          targets: [{ refId: 'A', expr: 'up' }],
        },
      ],
      getDataSource: async () => ({
        query: async () => ({
          data: [],
          errors: [{ refId: 'A', message: 'fatal failure' }],
        }),
      }),
    });

    expect(result.results[0]?.fatalError).toBe('fatal failure');
  });

  it('unsubscribes from observable queries when aborted', async () => {
    const controller = new AbortController();
    let unsubscribed = false;

    const promise = executeQueries({
      signal: controller.signal,
      requests: [
        {
          datasourceUid: 'prom-a',
          datasourceType: 'prometheus',
          requestId: 'request-1',
          range: { from: 1, to: 2 },
          timezone: 'utc',
          interval: '30s',
          intervalMs: 30_000,
          maxDataPoints: 500,
          targets: [{ refId: 'A', expr: 'up' }],
        },
      ],
      getDataSource: async () => ({
        query: () =>
          new Observable((subscriber) => {
            const timeout = setTimeout(() => {
              subscriber.next({ data: [createValueFrame('A', 1)] });
              subscriber.complete();
            }, 50);

            return () => {
              clearTimeout(timeout);
              unsubscribed = true;
            };
          }),
      }),
    });

    controller.abort();

    const result = await promise;

    expect(result.aborted).toBe(true);
    expect(unsubscribed).toBe(true);
  });

  it('handles promise rejections as fatal query failures', async () => {
    const controller = new AbortController();
    const result = await executeQueries({
      signal: controller.signal,
      requests: [
        {
          datasourceUid: 'prom-a',
          datasourceType: 'prometheus',
          requestId: 'request-1',
          range: { from: 1, to: 2 },
          timezone: 'utc',
          interval: '30s',
          intervalMs: 30_000,
          maxDataPoints: 500,
          targets: [{ refId: 'A', expr: 'up' }],
        },
      ],
      getDataSource: async () => ({
        query: async () => {
          throw new Error('network failure');
        },
      }),
    });

    expect(result.results[0]?.fatalError).toBe('network failure');
  });
});
