import { FieldType, LoadingState } from '@grafana/data';
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

  it('returns the last observable response when an empty response is followed by populated data', async () => {
    const controller = new AbortController();
    const presenceFrame = createValueFrame('A', 180);
    const result = await executeQueries({
      signal: controller.signal,
      requests: [
        {
          datasourceUid: 'prom-a',
          datasourceType: 'prometheus',
          requestId: 'request-1',
          range: { from: 1, to: 2 },
          timezone: 'utc',
          interval: '1h',
          intervalMs: 3_600_000,
          maxDataPoints: 500,
          targets: [{ refId: 'A', expr: 'sum(increase(probe_all_success_count[1h]))' }],
        },
      ],
      getDataSource: async () => ({
        query: () =>
          new Observable((subscriber) => {
            const timeout = setTimeout(() => {
              subscriber.next({ data: [] });
              subscriber.next({ data: [presenceFrame] });
              subscriber.complete();
            });

            return () => clearTimeout(timeout);
          }),
      }),
    });

    expect(result.results[0]?.frames).toHaveLength(1);
    expect(result.results[0]?.frames[0]?.fields[0]?.values).toEqual([180]);
  });

  it('combines distinct keyed partial responses', async () => {
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
          interval: '1h',
          intervalMs: 3_600_000,
          maxDataPoints: 500,
          targets: [
            { refId: 'A', expr: 'up' },
            { refId: 'B', expr: 'down' },
          ],
        },
      ],
      getDataSource: async () => ({
        query: () =>
          new Observable((subscriber) => {
            subscriber.next({ key: 'A', data: [createValueFrame('A', 1)] });
            subscriber.next({ key: 'B', data: [createValueFrame('B', 2)] });
            subscriber.complete();
          }),
      }),
    });

    expect(result.results[0]?.frames.map((frame) => frame.refId)).toEqual(['A', 'B']);
  });

  it('replaces an earlier keyed partial response with the same key', async () => {
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
          interval: '1h',
          intervalMs: 3_600_000,
          maxDataPoints: 500,
          targets: [{ refId: 'A', expr: 'up' }],
        },
      ],
      getDataSource: async () => ({
        query: () =>
          new Observable((subscriber) => {
            subscriber.next({ key: 'A', data: [createValueFrame('A', 1)] });
            subscriber.next({ key: 'A', data: [createValueFrame('A', 2)] });
            subscriber.complete();
          }),
      }),
    });

    expect(result.results[0]?.frames).toHaveLength(1);
    expect(result.results[0]?.frames[0]?.fields[0]?.values).toEqual([2]);
  });

  it('does not let a terminal empty loading emission erase populated data', async () => {
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
          interval: '1h',
          intervalMs: 3_600_000,
          maxDataPoints: 500,
          targets: [{ refId: 'A', expr: 'up' }],
        },
      ],
      getDataSource: async () => ({
        query: () =>
          new Observable((subscriber) => {
            subscriber.next({ data: [createValueFrame('A', 3)] });
            subscriber.next({ data: [], state: LoadingState.Loading });
            subscriber.complete();
          }),
      }),
    });

    expect(result.results[0]?.frames).toHaveLength(1);
    expect(result.results[0]?.frames[0]?.fields[0]?.values).toEqual([3]);
  });

  it('does not let a terminal empty loading emission erase a prior query error', async () => {
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
          interval: '1h',
          intervalMs: 3_600_000,
          maxDataPoints: 500,
          targets: [{ refId: 'A', expr: 'up' }],
        },
      ],
      getDataSource: async () => ({
        query: () =>
          new Observable((subscriber) => {
            subscriber.next({ data: [], errors: [{ message: 'query failed' }] });
            subscriber.next({ data: [], state: LoadingState.Loading });
            subscriber.complete();
          }),
      }),
    });

    expect(result.results[0]).toMatchObject({
      errors: [{ message: 'query failed' }],
      fatalError: 'query failed',
    });
  });

  it('preserves a legacy response error without a refId as a fatal query error', async () => {
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
          error: { message: 'legacy failure' },
        }),
      }),
    });

    expect(result.results[0]).toMatchObject({
      frames: [],
      errors: [{ message: 'legacy failure' }],
      fatalError: 'legacy failure',
    });
  });

  it('preserves an errors entry without a refId as a fatal query error', async () => {
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
          errors: [{ data: { message: 'backend failure' } }],
        }),
      }),
    });

    expect(result.results[0]).toMatchObject({
      frames: [],
      errors: [{ message: 'backend failure' }],
      fatalError: 'backend failure',
    });
  });

  it('turns an error response state into a fatal query error', async () => {
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
          state: LoadingState.Error,
        }),
      }),
    });

    expect(result.results[0]).toMatchObject({
      frames: [],
      errors: [{ message: 'Query response failed' }],
      fatalError: 'Query response failed',
    });
  });

  it('returns a fatal error when an observable completes without emitting a response', async () => {
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
        query: () =>
          new Observable((subscriber) => {
            subscriber.complete();
          }),
      }),
    });

    expect(result.results[0]?.fatalError).toBe('Query observable completed without emitting a response');
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

  it('preserves time fields while normalizing value field names', async () => {
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
          targets: [{ refId: 'B', expr: 'up' }],
        },
      ],
      getDataSource: async () => ({
        query: async () => ({
          data: [
            {
              refId: 'B',
              length: 2,
              fields: [
                { name: 'Time', type: FieldType.time, values: [1, 2], config: {} },
                { name: 'Value', type: FieldType.number, values: [0.6, 0.7], config: {} },
              ],
            },
          ],
        }),
      }),
    });

    const fields = result.results[0]?.frames[0]?.fields;
    expect(fields?.[0]).toMatchObject({ name: 'Time', type: FieldType.time });
    expect(fields?.[1]).toMatchObject({ name: 'Value #B', type: FieldType.number });
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
