import { ReliabilityEvidence } from './types';

import { getEvidenceExploreUrl } from './evidence';

const EVIDENCE: ReliabilityEvidence = {
  reqPerS: 12.5,
  errorRatio: 0.04,
  p99Ms: 340,
  statusDistribution: { '200': 12, '500': 0.5 },
  families: ['http_server_request_duration_seconds_bucket'],
  provenance: {
    datasource: 'prometheus-uid',
    range: { from: '1784800800000', to: '1784804400000' },
    queries: [
      { expr: 'sum(rate(http_requests_total[1h]))' },
      { expr: 'sum by (status) (rate(http_requests_total[1h]))' },
    ],
  },
};

describe('Reliability Inbox evidence provenance', () => {
  it('opens every evidence query in one Explore pane', () => {
    const exploreUrl = getEvidenceExploreUrl(EVIDENCE);
    const search = new URL(exploreUrl!, 'https://example.com').searchParams;

    expect(JSON.parse(search.get('left')!)).toEqual(
      expect.objectContaining({
        datasource: 'prometheus-uid',
        queries: [
          { refId: 'A', expr: 'sum(rate(http_requests_total[1h]))' },
          { refId: 'B', expr: 'sum by (status) (rate(http_requests_total[1h]))' },
        ],
      })
    );
  });

  it.each([
    ['provenance is absent', { ...EVIDENCE, provenance: undefined }],
    ['range is invalid', { ...EVIDENCE, provenance: { ...EVIDENCE.provenance!, range: { from: '2', to: '1' } } }],
    ['queries are absent', { ...EVIDENCE, provenance: { ...EVIDENCE.provenance!, queries: [] } }],
    ['a query is empty', { ...EVIDENCE, provenance: { ...EVIDENCE.provenance!, queries: [{ expr: ' ' }] } }],
  ])('does not construct a verification link when %s', (_, evidence) => {
    expect(getEvidenceExploreUrl(evidence as ReliabilityEvidence)).toBeUndefined();
  });
});
