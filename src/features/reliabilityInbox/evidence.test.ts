import { ReliabilityEvidence } from './types';

import { getEvidenceExploreUrl } from './evidence';

const EVIDENCE: ReliabilityEvidence = {
  reqPerS: 12.5,
  errorRatio: 0.04,
  p99Ms: 340,
  statusDistribution: { '200': 12, '500': 0.5 },
  families: ['http_server_request_duration_seconds_bucket'],
  activitySemantics: ['requests'],
  window: {
    from: 1_784_800_800_000,
    to: 1_784_804_400_000,
  },
  datasource: {
    uid: 'prometheus-uid',
    type: 'prometheus',
  },
  queries: [
    { key: 'requestRate', expr: 'sum(rate(http_requests_total[1h]))' },
    { key: 'statusDistribution', expr: 'sum by (status) (rate(http_requests_total[1h]))' },
  ],
};

describe('Reliability Inbox evidence provenance', () => {
  it('opens every evidence query in one Explore pane', () => {
    const exploreUrl = getEvidenceExploreUrl(EVIDENCE, 1);
    const search = new URL(exploreUrl!, 'https://example.com').searchParams;
    const panes = JSON.parse(search.get('panes')!);

    expect(search.get('schemaVersion')).toBe('1');
    expect(search.get('orgId')).toBe('1');
    expect(panes['reliability-inbox-evidence']).toEqual({
      datasource: 'prometheus-uid',
      queries: [
        {
          refId: 'A',
          datasource: { uid: 'prometheus-uid', type: 'prometheus' },
          expr: 'sum(rate(http_requests_total[1h]))',
          editorMode: 'code',
          range: true,
          instant: false,
        },
        {
          refId: 'B',
          datasource: { uid: 'prometheus-uid', type: 'prometheus' },
          expr: 'sum by (status) (rate(http_requests_total[1h]))',
          editorMode: 'code',
          range: true,
          instant: false,
        },
      ],
      range: {
        from: String(EVIDENCE.window!.from),
        to: String(EVIDENCE.window!.to),
      },
    });
  });

  it.each([
    ['datasource is absent', { ...EVIDENCE, datasource: undefined }, 1],
    ['window is absent', { ...EVIDENCE, window: undefined }, 1],
    ['window is invalid', { ...EVIDENCE, window: { from: 2, to: 1 } }, 1],
    ['queries are absent', { ...EVIDENCE, queries: [] }, 1],
    ['a query is empty', { ...EVIDENCE, queries: [{ key: 'requestRate', expr: ' ' }] }, 1],
    ['organization context is absent', EVIDENCE, undefined],
  ])('does not construct a verification link when %s', (_, evidence, orgId) => {
    expect(getEvidenceExploreUrl(evidence as ReliabilityEvidence, orgId)).toBeUndefined();
  });
});
