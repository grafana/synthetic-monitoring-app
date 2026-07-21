import { DataFrame, DataQueryRequest, DataQueryResponse, FieldType } from '@grafana/data';
import { DataSourceApi } from '@grafana/data';
import { isObservable, Observable } from 'rxjs';

import { ExecuteQueriesResult, QueryExecutionResult, ResolvedQueryRequest } from './types';

export type DataSourceQueryable = Pick<DataSourceApi, 'query'>;

export type ExecuteQueriesOptions = {
  requests: ResolvedQueryRequest[];
  signal: AbortSignal;
  getDataSource: (uid: string) => Promise<DataSourceQueryable>;
};

function normalizeFrame(frame: DataFrame): DataFrame {
  return {
    ...frame,
    fields: frame.fields.map((field) => ({
      ...field,
      name: field.name.startsWith('Value #') ? field.name : `Value #${frame.refId ?? field.name}`,
      type: field.type ?? FieldType.number,
    })),
  };
}

function normalizeResponse(response: DataQueryResponse, request: ResolvedQueryRequest): QueryExecutionResult {
  const frames = (response.data ?? []).map(normalizeFrame);
  const errors = response.errors
    ?.filter((error): error is { refId: string; message?: string } => Boolean(error.refId))
    .map((error) => ({
      refId: error.refId,
      message: error.message ?? 'Unknown query error',
    }));

  if (frames.length === 0 && errors?.length) {
    return {
      requestId: request.requestId,
      datasourceUid: request.datasourceUid,
      frames: [],
      fatalError: errors[0]?.message,
      errors,
    };
  }

  return {
    requestId: request.requestId,
    datasourceUid: request.datasourceUid,
    frames,
    errors,
  };
}

async function runQuery(
  request: ResolvedQueryRequest,
  getDataSource: ExecuteQueriesOptions['getDataSource'],
  signal: AbortSignal
): Promise<QueryExecutionResult> {
  if (signal.aborted) {
    return {
      requestId: request.requestId,
      datasourceUid: request.datasourceUid,
      frames: [],
      fatalError: 'aborted',
    };
  }

  const datasource = await getDataSource(request.datasourceUid);
  const responsePromise = datasource.query({
    requestId: request.requestId,
    interval: request.interval,
    intervalMs: request.intervalMs,
    maxDataPoints: request.maxDataPoints,
    range: {
      from: request.range.from,
      to: request.range.to,
      raw: {
        from: request.range.from,
        to: request.range.to,
      },
    },
    scopedVars: {},
    timezone: request.timezone,
    targets: request.targets,
  } as unknown as DataQueryRequest);

  const response = isObservable(responsePromise)
    ? await observeWithAbort(responsePromise as Observable<DataQueryResponse>, signal)
    : await responsePromise;

  if (signal.aborted) {
    return {
      requestId: request.requestId,
      datasourceUid: request.datasourceUid,
      frames: [],
      fatalError: 'aborted',
    };
  }

  return normalizeResponse(response, request);
}

function observeWithAbort<T>(observable: Observable<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const subscription = observable.subscribe({
      next: (value) => {
        subscription.unsubscribe();
        resolve(value);
      },
      error: reject,
    });

    if (signal.aborted) {
      subscription.unsubscribe();
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    signal.addEventListener(
      'abort',
      () => {
        subscription.unsubscribe();
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true }
    );
  });
}

export async function executeQueries(options: ExecuteQueriesOptions): Promise<ExecuteQueriesResult> {
  if (options.signal.aborted) {
    return { results: [], aborted: true };
  }

  const results: QueryExecutionResult[] = [];

  for (const request of options.requests) {
    try {
      results.push(await runQuery(request, options.getDataSource, options.signal));
    } catch (error) {
      if (options.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
        return { results, aborted: true };
      }

      results.push({
        requestId: request.requestId,
        datasourceUid: request.datasourceUid,
        frames: [],
        fatalError: error instanceof Error ? error.message : 'Unknown query failure',
      });
    }
  }

  return {
    results,
    aborted: options.signal.aborted,
  };
}
