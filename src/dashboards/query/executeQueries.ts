import {
  DataFrame,
  DataQueryError,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  dateTime,
  FieldType,
  LoadingState,
} from '@grafana/data';
import { isObservable, Observable, Subscription } from 'rxjs';

import { ExecuteQueriesResult, QueryExecutionResult, ResolvedQueryRequest } from './types';

export type DataSourceQueryable = Pick<DataSourceApi, 'query'>;

export type ExecuteQueriesOptions = {
  requests: ResolvedQueryRequest[];
  signal: AbortSignal;
  getDataSource: (uid: string) => Promise<DataSourceQueryable>;
};

function getLegacyResponseError(response: DataQueryResponse): DataQueryError | undefined {
  return (response as unknown as { error?: DataQueryError }).error;
}

function normalizeFrame(frame: DataFrame): DataFrame {
  return {
    ...frame,
    fields: frame.fields.map((field) => {
      // Preserve time fields — renaming them to Value #refId breaks reduce/timeseries panels.
      if (field.type === FieldType.time || field.name === 'Time' || field.name.startsWith('Value #')) {
        return field;
      }

      return {
        ...field,
        name: `Value #${frame.refId ?? field.name}`,
        type: field.type ?? FieldType.number,
      };
    }),
  };
}

function normalizeResponse(response: DataQueryResponse, request: ResolvedQueryRequest): QueryExecutionResult {
  const frames = (response.data ?? []).map(normalizeFrame);
  const legacyError = getLegacyResponseError(response);
  const responseErrors = [...(response.errors ?? []), ...(legacyError ? [legacyError] : [])];

  if (response.state === LoadingState.Error && responseErrors.length === 0) {
    responseErrors.push({ message: 'Query response failed' });
  }

  const errors = responseErrors.map((error) => ({
    refId: error.refId,
    message:
      error.message ??
      error.data?.message ??
      error.statusText ??
      'Unknown query error',
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
  const from = dateTime(request.range.from);
  const to = dateTime(request.range.to);
  const responsePromise = datasource.query({
    requestId: request.requestId,
    interval: request.interval,
    intervalMs: request.intervalMs,
    maxDataPoints: request.maxDataPoints,
    range: {
      from,
      to,
      raw: {
        from: from.toISOString(),
        to: to.toISOString(),
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

function isEmptyLoadingResponse(response: DataQueryResponse) {
  const legacyError = getLegacyResponseError(response);

  return (
    response.state === LoadingState.Loading &&
    response.data.length === 0 &&
    !legacyError &&
    !response.errors?.length
  );
}

function hasResponsePayload(response: DataQueryResponse | undefined) {
  return Boolean(
    response &&
      (response.data.length > 0 ||
        response.errors?.length ||
        getLegacyResponseError(response) ||
        response.state === LoadingState.Error)
  );
}

function combineResponses(responses: DataQueryResponse[]): DataQueryResponse {
  const errors = responses.flatMap((response) => {
    const legacyError = getLegacyResponseError(response);

    return [...(response.errors ?? []), ...(legacyError ? [legacyError] : [])];
  });

  return {
    data: responses.flatMap((response) => response.data),
    errors: errors.length > 0 ? errors : undefined,
    state: responses.some((response) => response.state === LoadingState.Error)
      ? LoadingState.Error
      : responses.at(-1)?.state,
  };
}

function observeWithAbort(
  observable: Observable<DataQueryResponse>,
  signal: AbortSignal
): Promise<DataQueryResponse> {
  return new Promise((resolve, reject) => {
    let subscription: Subscription | undefined;
    let hasValue = false;
    let unkeyedResponse: DataQueryResponse | undefined;
    const keyedResponses = new Map<string, DataQueryResponse>();
    let settled = false;

    const cleanup = () => signal.removeEventListener('abort', onAbort);
    const onAbort = () => {
      subscription?.unsubscribe();

      if (!settled) {
        settled = true;
        cleanup();
        reject(new DOMException('Aborted', 'AbortError'));
      }
    };

    signal.addEventListener('abort', onAbort, { once: true });

    subscription = observable.subscribe({
      next: (value) => {
        hasValue = true;

        if (value.key !== undefined) {
          const previous = keyedResponses.get(value.key);

          if (!isEmptyLoadingResponse(value) || !hasResponsePayload(previous)) {
            keyedResponses.set(value.key, value);
          }
          return;
        }

        if (!isEmptyLoadingResponse(value) || !hasResponsePayload(unkeyedResponse)) {
          unkeyedResponse = value;
        }
      },
      error: (error) => {
        settled = true;
        cleanup();
        reject(error);
      },
      complete: () => {
        settled = true;
        cleanup();

        if (!hasValue) {
          reject(new Error('Query observable completed without emitting a response'));
          return;
        }

        resolve(
          combineResponses([
            ...(unkeyedResponse ? [unkeyedResponse] : []),
            ...keyedResponses.values(),
          ])
        );
      },
    });

    if (signal.aborted) {
      onAbort();
    }
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
