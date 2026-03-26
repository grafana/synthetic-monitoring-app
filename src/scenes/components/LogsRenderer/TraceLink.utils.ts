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
