import { DataFrame } from '@grafana/data';
import { METRICS_DATASOURCE } from 'test/fixtures/datasources';
import { HTTP_RELIABILITY_SUGGESTION } from 'test/fixtures/reliabilityInbox';

import { ReliabilityEvidence } from './types';

import { queryRecommendationTelemetry } from './data';
import { getEvidenceExploreUrl, getRecommendationTelemetryProvenance } from './evidence';

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

  it('preserves provenance ref IDs and uses a short window for inline trends', () => {
    const provenance = getRecommendationTelemetryProvenance({
      ...HTTP_RELIABILITY_SUGGESTION.evidence,
      provenance: {
        datasource: 'prometheus-uid',
        range: { from: '1784800800000', to: '1784804400000' },
        queries: [
          { refId: 'A', expr: 'sum(rate(http_requests_total[1h]))' },
          { refId: 'C', expr: 'histogram_quantile(0.99, sum(rate(http_request_duration_bucket[1h])))' },
        ],
      },
    });

    expect(provenance?.queries).toEqual([
      {
        refId: 'A',
        expr: 'sum(rate(http_requests_total[5m]))',
        instant: false,
        range: true,
      },
      {
        refId: 'C',
        expr: 'histogram_quantile(0.99, sum(rate(http_request_duration_bucket[5m])))',
        instant: false,
        range: true,
      },
    ]);
  });

  it('runs inline trends against the configured Synthetic Monitoring metrics datasource', async () => {
    const frame = { refId: 'A' } as DataFrame;
    const executeQuery = jest.fn().mockResolvedValue({ A: [frame] });

    const result = await queryRecommendationTelemetry(
      HTTP_RELIABILITY_SUGGESTION.evidence,
      METRICS_DATASOURCE,
      executeQuery
    );

    expect(executeQuery).toHaveBeenCalledWith({
      start: 1784800800000,
      end: 1784804400000,
      queries: [
        expect.objectContaining({
          refId: 'A',
          interval: '1m',
          intervalMs: 60_000,
          maxDataPoints: 120,
          datasource: { uid: METRICS_DATASOURCE.uid, type: METRICS_DATASOURCE.type },
        }),
      ],
    });
    expect(result).toEqual([frame]);
  });
});
