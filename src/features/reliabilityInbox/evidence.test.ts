import { ReliabilityEvidencePrototype } from './types';

import { getEvidenceExploreUrl, getEvidencePanelData } from './evidence';

const EVIDENCE: ReliabilityEvidencePrototype = {
  kind: 'graft-demo-v1',
  window: {
    label: 'the last 24 hours',
    from: 1_784_800_800_000,
    to: 1_784_887_200_000,
  },
  exactRequestTotal: 14_700,
  timeline: [
    { timestamp: 1_784_800_800_000, requests: 5100 },
    { timestamp: 1_784_804_400_000, requests: 4900 },
    { timestamp: 1_784_808_000_000, requests: 4700 },
  ],
};

describe('Reliability Inbox prototype evidence', () => {
  it('formats timeline samples as a Grafana time-series frame', () => {
    const panelData = getEvidencePanelData(EVIDENCE);

    expect(panelData.series).toHaveLength(1);
    expect(panelData.series[0].fields[0].values).toEqual([1_784_800_800_000, 1_784_804_400_000, 1_784_808_000_000]);
    expect(panelData.series[0].fields[1].values).toEqual([5100, 4900, 4700]);
    expect(panelData.series[0].fields[1].config.unit).toBe('short');
  });

  it('builds a current Explore panes URL only from complete, matching provenance', () => {
    const evidenceWithSource: ReliabilityEvidencePrototype = {
      ...EVIDENCE,
      source: {
        datasourceUid: 'prometheus-uid',
        datasourceType: 'prometheus',
        expression: 'sum(increase(http_requests_total[1h]))',
        from: EVIDENCE.window.from,
        to: EVIDENCE.window.to,
      },
    };

    const exploreUrl = getEvidenceExploreUrl(evidenceWithSource, 1);
    const search = new URL(exploreUrl!, 'https://example.com').searchParams;
    const panes = JSON.parse(search.get('panes')!);

    expect(search.get('schemaVersion')).toBe('1');
    expect(search.get('orgId')).toBe('1');
    expect(panes['reliability-inbox-evidence']).toEqual({
      datasource: 'prometheus-uid',
      queries: [
        {
          refId: 'A',
          datasource: {
            uid: 'prometheus-uid',
            type: 'prometheus',
          },
          expr: 'sum(increase(http_requests_total[1h]))',
          editorMode: 'code',
          range: true,
          instant: false,
        },
      ],
      range: {
        from: String(EVIDENCE.window.from),
        to: String(EVIDENCE.window.to),
      },
    });
  });

  it.each([
    ['source is absent', EVIDENCE, 1],
    [
      'source time range differs',
      {
        ...EVIDENCE,
        source: {
          datasourceUid: 'prometheus-uid',
          datasourceType: 'prometheus',
          expression: 'sum(rate(http_requests_total[5m]))',
          from: EVIDENCE.window.from + 1,
          to: EVIDENCE.window.to,
        },
      },
      1,
    ],
    [
      'query is empty',
      {
        ...EVIDENCE,
        source: {
          datasourceUid: 'prometheus-uid',
          datasourceType: 'prometheus',
          expression: ' ',
          from: EVIDENCE.window.from,
          to: EVIDENCE.window.to,
        },
      },
      1,
    ],
    [
      'organization context is absent',
      {
        ...EVIDENCE,
        source: {
          datasourceUid: 'prometheus-uid',
          datasourceType: 'prometheus',
          expression: 'sum(rate(http_requests_total[5m]))',
          from: EVIDENCE.window.from,
          to: EVIDENCE.window.to,
        },
      },
      undefined,
    ],
  ])('does not construct a verification link when %s', (_, evidence, orgId) => {
    expect(getEvidenceExploreUrl(evidence as ReliabilityEvidencePrototype, orgId)).toBeUndefined();
  });
});
