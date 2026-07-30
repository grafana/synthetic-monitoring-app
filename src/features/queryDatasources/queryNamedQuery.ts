import { DataFrame, dataFrameFromJSON } from '@grafana/data';
import { BackendDataSourceResponse, getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { QueryType } from 'datasource/types';

interface QueryNamedQueryOptions {
  datasource: { uid: string; type: string };
  /** Epoch milliseconds */
  from: number;
  /** Parameters the named query takes; the expression itself lives in the backend */
  params?: Record<string, unknown>;
  queryType: QueryType;
  refId: string;
  /** Epoch milliseconds */
  to: number;
}

/**
 * Ask a backend datasource for a query *by name*.
 *
 * Note what is absent from the request: there is no PromQL or LogQL, and no
 * Prometheus or Loki uid. The app names what it wants and passes parameters; the
 * backend owns the expression and picks the datasource that holds the data.
 */
export function queryNamedQuery({ datasource, from, params, queryType, refId, to }: QueryNamedQueryOptions) {
  return firstValueFrom(
    getBackendSrv().fetch<BackendDataSourceResponse>({
      method: 'POST',
      url: `/api/ds/query?refId=${refId}`,
      data: {
        from: String(from),
        to: String(to),
        queries: [
          {
            refId,
            queryType,
            datasource,
            ...params,
          },
        ],
      },
    })
  ).then(({ data }) => {
    const frames = data.results[refId]?.frames ?? [];

    return frames.map((frame) => dataFrameFromJSON(frame)) as DataFrame[];
  });
}
