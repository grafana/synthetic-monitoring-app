import { createDataFrame, dateTime, FieldType, LoadingState, PanelData } from '@grafana/data';

import { ReliabilityEvidencePrototype, ReliabilityEvidenceReference } from './types';

export interface ReliabilityEvidenceInvestigationLink {
  destination: ReliabilityEvidenceReference['destination'];
  href: string;
  label: string;
}

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

export function getEvidenceInvestigationLinks(
  evidence: ReliabilityEvidencePrototype | undefined,
  references: ReliabilityEvidenceReference[] | undefined,
  orgId: number | undefined
): ReliabilityEvidenceInvestigationLink[] {
  const links: ReliabilityEvidenceInvestigationLink[] = [];
  const exploreUrl = evidence ? getEvidenceExploreUrl(evidence, orgId) : undefined;

  if (exploreUrl) {
    links.push({
      destination: 'explore',
      href: exploreUrl,
      label: 'Open backing query in Explore',
    });
  }

  for (const reference of references ?? []) {
    const path = reference.path.trim();
    if (!isSafeGrafanaPath(path)) {
      continue;
    }

    links.push({
      destination: reference.destination,
      href: path,
      label: reference.label?.trim() || getDefaultReferenceLabel(reference.destination),
    });
  }

  return links.filter((link, index) => links.findIndex((candidate) => candidate.href === link.href) === index);
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

function isSafeGrafanaPath(path: string) {
  return path.startsWith('/') && !path.startsWith('//');
}

function getDefaultReferenceLabel(destination: ReliabilityEvidenceReference['destination']) {
  return {
    explore: 'Open backing query in Explore',
    dashboard: 'Open backing dashboard',
    logs: 'Open related logs',
    traces: 'Open related traces',
  }[destination];
}
