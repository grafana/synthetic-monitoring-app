import { TRACE_ID_LABEL_NAMES, TRACE_LABEL_NAMES } from './TraceLink.constants';

export function isTraceLabel(labelName: string): boolean {
  return TRACE_LABEL_NAMES.has(labelName);
}

export function isTraceIdLabel(labelName: string): boolean {
  return TRACE_ID_LABEL_NAMES.has(labelName);
}

export function getExploreTraceUrl(datasourceUid: string, traceId: string): string {
  const left = encodeURIComponent(
    JSON.stringify({
      datasource: datasourceUid,
      queries: [
        {
          refId: 'A',
          queryType: 'traceql',
          query: traceId,
        },
      ],
    })
  );

  return `/explore?left=${left}`;
}

export function getExploreTracesUrl(
  datasourceUid: string,
  traceId: string,
  timeRange: { from: number; to: number }
): string {
  const params = new URLSearchParams({
    from: String(timeRange.from),
    to: String(timeRange.to),
    'var-ds': datasourceUid,
    traceId,
  });

  return `/a/grafana-exploretraces-app/explore?${params.toString()}`;
}
