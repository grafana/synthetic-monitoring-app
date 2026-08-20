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
      { refId: 'A', expr: 'sum(rate({__name__="http_requests_total", host=~"example"}[1h]))' },
      {
        refId: 'B',
        expr: 'sum by (status) (rate({__name__="http_requests_total", host=~"example"}[1h]))',
      },
      {
        refId: 'C',
        expr: 'histogram_quantile(0.99, sum by (le) (rate({__name__="http_request_duration_seconds_bucket", host=~"example"}[1h])))',
      },
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
          {
            refId: 'RequestRate',
            expr: 'sum(rate({__name__="http_requests_total", host=~"example"}[5m]))',
            instant: false,
            legendFormat: 'Requests per second',
          },
          {
            refId: 'ServerErrorRatio',
            expr: 'sum(rate({__name__="http_requests_total", host=~"example", status=~"5.."}[5m])) / sum(rate({__name__="http_requests_total", host=~"example"}[5m]))',
            instant: false,
            legendFormat: '5xx response ratio',
          },
          {
            refId: 'P99ResponseTime',
            expr: 'histogram_quantile(0.99, sum by (le) (rate({__name__="http_request_duration_seconds_bucket", host=~"example"}[5m])))',
            instant: false,
            legendFormat: 'p99 response time',
          },
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
