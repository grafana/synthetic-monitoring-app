import { DataFrame, dataFrameFromJSON } from '@grafana/data';
import { BackendDataSourceResponse, getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

type Query = Record<string, any> & {
  refId: string;
  expr: string;
  range: boolean;
  datasource: { uid: string; type: string };
  maxDataPoints?: number;
};

// abstract this so can provide multiple queries
export function queryDS({ queries, start, end }: { queries: Query[]; start: number; end: number }) {
  return firstValueFrom(
    getBackendSrv().fetch<BackendDataSourceResponse>({
      method: 'POST',
      url: `/api/ds/query?refId=${queries.map((q) => q.refId).join(',')}`,
      data: {
        from: String(start),
        to: String(end),
        queries,
      },
    })
  ).then(({ data }) => {
    const { results } = data;
    const build: Record<string, DataFrame[]> = {};

    Object.entries(results).forEach(([refId, result]) => {
      const frames = result.frames || [];
      build[refId] = frames.map((frame) => dataFrameFromJSON(frame));
    });

    return build;
  });
}
