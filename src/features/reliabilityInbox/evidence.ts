import { createDataFrame, dateTime, FieldType, LoadingState, PanelData } from '@grafana/data';

import { ReliabilityEvidencePrototype } from './types';

export function getEvidenceExploreUrl(
  evidence: ReliabilityEvidencePrototype,
  orgId: number | undefined
): string | undefined {
  const source = evidence.source;

  if (
    !source ||
    !source.datasourceUid.trim() ||
    !source.datasourceType.trim() ||
    !source.expression.trim() ||
    source.from !== evidence.window.from ||
    source.to !== evidence.window.to ||
    source.from >= source.to ||
    !Number.isFinite(orgId)
  ) {
    return undefined;
  }

  const panes = {
    'reliability-inbox-evidence': {
      datasource: source.datasourceUid,
      queries: [
        {
          refId: 'A',
          datasource: {
            uid: source.datasourceUid,
            type: source.datasourceType,
          },
          expr: source.expression,
          editorMode: 'code',
          range: true,
          instant: false,
        },
      ],
      range: {
        from: String(source.from),
        to: String(source.to),
      },
    },
  };
  const params = new URLSearchParams({
    panes: JSON.stringify(panes),
    schemaVersion: '1',
    orgId: String(orgId),
  });

  return `/explore?${params.toString()}`;
}

export function getEvidencePanelData(evidence: ReliabilityEvidencePrototype): PanelData {
  const frame = createDataFrame({
    name: 'Observed requests',
    refId: 'A',
    fields: [
      {
        name: 'Time',
        type: FieldType.time,
        values: evidence.timeline.map(({ timestamp }) => timestamp),
      },
      {
        name: 'Requests',
        type: FieldType.number,
        values: evidence.timeline.map(({ requests }) => requests),
        config: {
          displayName: 'Requests',
          unit: 'short',
        },
      },
    ],
  });

  return {
    state: LoadingState.Done,
    series: [frame],
    timeRange: {
      from: dateTime(evidence.window.from),
      to: dateTime(evidence.window.to),
      raw: {
        from: String(evidence.window.from),
        to: String(evidence.window.to),
      },
    },
  };
}
