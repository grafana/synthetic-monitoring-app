import { dataFrameFromJSON, DataSourceInstanceSettings, dateTime, LoadingState, PanelData } from '@grafana/data';
import { BackendDataSourceResponse, getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

export async function fetchTraceData(
  traceId: string,
  tracesDS: DataSourceInstanceSettings,
  _logTimestamp: number
): Promise<PanelData> {
  const { data } = await firstValueFrom(
    getBackendSrv().fetch<BackendDataSourceResponse>({
      method: 'POST',
      url: `/api/ds/query?ds_type=${tracesDS.type}&refId=${traceId}`,
      data: {
        from: '0',
        to: '0',
        queries: [
          {
            refId: traceId,
            datasource: { type: tracesDS.type, uid: tracesDS.uid },
            queryType: 'traceId',
            query: traceId,
            limit: 20,
            tableType: 'traces',
          },
        ],
      },
      showErrorAlert: false,
    })
  );

  const frames = data.results?.[traceId]?.frames ?? [];
  const series = frames.map((frame) => dataFrameFromJSON(frame));

  return {
    state: LoadingState.Done,
    series,
    timeRange: {
      from: dateTime(0),
      to: dateTime(0),
      raw: { from: '0', to: '0' },
    },
  };
}
