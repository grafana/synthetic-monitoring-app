import { ReliabilityEvidence } from './types';

export function getEvidenceExploreUrl(evidence: ReliabilityEvidence, orgId: number | undefined): string | undefined {
  const { datasource, queries, window } = evidence;

  if (
    !datasource?.uid.trim() ||
    !datasource.type.trim() ||
    !window ||
    !Number.isFinite(window.from) ||
    !Number.isFinite(window.to) ||
    window.from >= window.to ||
    !queries?.length ||
    queries.some(({ expr }) => !expr.trim()) ||
    !Number.isFinite(orgId)
  ) {
    return undefined;
  }

  const panes = {
    'reliability-inbox-evidence': {
      datasource: datasource.uid,
      queries: queries.map(({ expr }, index) => ({
        refId: String.fromCharCode('A'.charCodeAt(0) + index),
        datasource: {
          uid: datasource.uid,
          type: datasource.type,
        },
        expr,
        editorMode: 'code',
        range: true,
        instant: false,
      })),
      range: {
        from: String(window.from),
        to: String(window.to),
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
