import { classifyNodeInsights, getPropagatedCheckSources } from './ConnectedServices.origins';
import { NeighbourhoodNode } from './ConnectedServices.utils';

const labels = {
  asserts_origin_env: 'none',
  asserts_source_entity_type: 'SyntheticCheck',
  asserts_source_entity_name: 'check__https://example.com',
};

it('matches context-prefixed insights and deduplicates verified source checks', () => {
  const leaf = { assertionName: 'LatencyBreach', alertName: 'LatencyBreach', labels };
  expect(getPropagatedCheckSources([{ nestedTimelines: [leaf, leaf] }], 'avg_breach::LatencyBreach')).toEqual([
    'check__https://example.com',
  ]);
});

it('does not infer provenance from a name, source type alone, or aggregated labels', () => {
  expect(
    getPropagatedCheckSources(
      [
        {
          alertName: 'LatencyBreach',
          labels: { asserts_source_entity_type: 'SyntheticCheck', asserts_source_entity_name: 'check' },
        },
        { alertName: 'LatencyBreach', labels: { ...labels, asserts_source_entity_name: '["one","two"]' } },
        { alertName: 'OtherBreach', labels },
      ],
      'LatencyBreach'
    )
  ).toEqual([]);
});

function serviceNode(overrides: Partial<NeighbourhoodNode> = {}): NeighbourhoodNode {
  return {
    id: 'Service:frontend:prod::otel-demo',
    name: 'frontend',
    entityType: 'Service',
    insightCount: 2,
    insightNames: ['ErrorRatioBreach', 'LatencyAverageBreach'],
    ringSegments: [{ severity: 'critical', fraction: 1 }],
    scope: { env: 'prod', site: '', namespace: 'otel-demo' },
    ...overrides,
  };
}

it('classifies insights into own vs connected with per-insight severities', () => {
  const entities = [
    {
      type: 'Service',
      name: 'frontend',
      scope: { env: 'prod', namespace: 'otel-demo' },
      allAssertions: [
        {
          nestedTimelines: [
            { assertionName: 'ErrorRatioBreach', alertName: 'ErrorRatioBreach', labels: { ...labels, asserts_severity: 'critical' } },
            { assertionName: 'LatencyAverageBreach', alertName: 'LatencyAverageBreach', labels: { asserts_severity: 'warning' } },
          ],
        },
      ],
    },
  ];

  expect(classifyNodeInsights(entities, serviceNode())).toEqual({
    own: [{ name: 'LatencyAverageBreach', severity: 'warning', sources: [] }],
    connected: [{ name: 'ErrorRatioBreach', severity: 'critical', sources: ['check__https://example.com'] }],
  });
});

it('surfaces a propagated insight the frame insightNames do not list', () => {
  const entities = [
    {
      type: 'Service',
      name: 'frontend',
      scope: { env: 'prod', namespace: 'otel-demo' },
      allAssertions: [
        {
          assertionName: 'check_failures::CheckBreach',
          alertName: 'CheckBreach',
          labels: { ...labels, asserts_severity: 'critical' },
        },
      ],
    },
  ];

  expect(classifyNodeInsights(entities, serviceNode({ insightNames: ['ErrorRatioBreach'] }))).toEqual({
    own: [{ name: 'ErrorRatioBreach', severity: 'critical', sources: [] }],
    connected: [{ name: 'check_failures::CheckBreach', severity: 'critical', sources: ['check__https://example.com'] }],
  });
});

it('keeps every insight in the own bucket with the node severity when timelines do not cover it', () => {
  expect(classifyNodeInsights([], serviceNode())).toEqual({
    own: [
      { name: 'ErrorRatioBreach', severity: 'critical', sources: [] },
      { name: 'LatencyAverageBreach', severity: 'critical', sources: [] },
    ],
    connected: [],
  });
});

it('ignores timelines belonging to a different entity identity', () => {
  const entities = [
    {
      type: 'Service',
      name: 'frontend',
      // Same name, different scope: a staging twin must not lend its provenance to prod.
      scope: { env: 'staging', namespace: 'otel-demo' },
      allAssertions: [
        { assertionName: 'ErrorRatioBreach', alertName: 'ErrorRatioBreach', labels: { ...labels, asserts_severity: 'critical' } },
      ],
    },
  ];

  expect(classifyNodeInsights(entities, serviceNode()).connected).toEqual([]);
});
