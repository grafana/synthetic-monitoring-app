import { toDataFrame } from '@grafana/data';
import { buildNeighbourhoodFrames } from 'test/fixtures/knowledgeGraph';

import {
  buildServiceNeighbourhoodQuery,
  escapeCypher,
  getEntityDrawerUrl,
  getRingSegments,
  getServiceEntityUrl,
  layoutNeighbourhood,
  NeighbourhoodNode,
  parseGraphFrames,
} from './ConnectedServices.utils';

describe('escapeCypher', () => {
  it('escapes double quotes and backslashes so interpolated values cannot break out of the string', () => {
    expect(escapeCypher('grafana"; MATCH (n) DETACH DELETE n //')).toBe('grafana\\"; MATCH (n) DETACH DELETE n //');
    expect(escapeCypher('path\\to\\thing')).toBe('path\\\\to\\\\thing');
  });

  it('leaves plain values untouched', () => {
    expect(escapeCypher('vika http check.__http://grafana.com')).toBe('vika http check.__http://grafana.com');
  });
});

describe('buildServiceNeighbourhoodQuery', () => {
  it('matches the monitored service and walks CALLS in both directions', () => {
    const query = buildServiceNeighbourhoodQuery('vika http check.__http://grafana.com');

    expect(query).toContain(
      'MATCH (sy:SyntheticCheck {name: "vika http check.__http://grafana.com"})<-[:MONITORED_BY]-(s1:Service)'
    );
    // outbound dependencies
    expect(query).toContain('OPTIONAL MATCH (s1)-[:CALLS]->(downstream:Service)');
    // inbound callers
    expect(query).toContain('OPTIONAL MATCH (upstream:Service)-[:CALLS]->(s1)');
    expect(query).toContain('RETURN sy, s1, downstream, upstream');
  });

  it('escapes the entity name it interpolates', () => {
    const query = buildServiceNeighbourhoodQuery('evil"} DETACH DELETE n //');

    expect(query).toContain('{name: "evil\\"} DETACH DELETE n //"}');
  });
});

describe('getServiceEntityUrl', () => {
  it('builds a deep link to the Service entity page in the Knowledge Graph app', () => {
    expect(getServiceEntityUrl('frontend')).toBe('/a/grafana-asserts-app/catalog/Service/frontend');
  });

  it('scopes the link by namespace when provided and encodes both parts', () => {
    expect(getServiceEntityUrl('front end', 'otel demo')).toBe(
      '/a/grafana-asserts-app/catalog/Service/front%20end?namespace=otel%20demo'
    );
  });
});

describe('getRingSegments', () => {
  it('renders a single muted baseline segment for a healthy node (no insights)', () => {
    expect(getRingSegments({ errors: 0, warning: 0, amend: 0 })).toEqual([{ severity: 'healthy', fraction: 1 }]);
  });

  it('maps a single severity to a full ring of that severity', () => {
    expect(getRingSegments({ errors: 1, warning: 0, amend: 0 })).toEqual([{ severity: 'critical', fraction: 1 }]);
    expect(getRingSegments({ errors: 0, warning: 1, amend: 0 })).toEqual([{ severity: 'warning', fraction: 1 }]);
    expect(getRingSegments({ errors: 0, warning: 0, amend: 1 })).toEqual([{ severity: 'info', fraction: 1 }]);
  });

  it('splits mixed severities proportionally (the datasource emits 50/50 arcs)', () => {
    expect(getRingSegments({ errors: 0.5, warning: 0, amend: 0.5 })).toEqual([
      { severity: 'critical', fraction: 0.5 },
      { severity: 'info', fraction: 0.5 },
    ]);
  });

  it('normalizes fractions that do not sum to 1', () => {
    expect(getRingSegments({ errors: 1, warning: 1, amend: 0 })).toEqual([
      { severity: 'critical', fraction: 0.5 },
      { severity: 'warning', fraction: 0.5 },
    ]);
  });
});

describe('parseGraphFrames', () => {
  it('parses the nodes and edges frames into the typed neighbourhood model', () => {
    const { nodes, edges, ids } = buildNeighbourhoodFrames();

    const graph = parseGraphFrames([nodes, edges]);

    expect(graph.nodes).toHaveLength(4);
    expect(graph.edges).toHaveLength(3);

    const check = graph.nodes.find((n) => n.id === ids.checkId);
    expect(check).toMatchObject({
      name: 'my check__https://grafana.com',
      entityType: 'SyntheticCheck',
      icon: 'heart-rate',
      insightCount: 0,
      insightNames: [],
      ringSegments: [{ severity: 'healthy', fraction: 1 }],
      scope: { env: 'unknown', site: '', namespace: '' },
    });

    const service = graph.nodes.find((n) => n.id === ids.serviceId);
    expect(service).toMatchObject({
      name: 'frontend',
      entityType: 'Service',
      insightCount: 2,
      insightNames: ['ErrorRatioBreach', 'LatencyAverageBreach'],
      ringSegments: [{ severity: 'critical', fraction: 1 }],
      scope: { env: 'prod', site: '', namespace: 'otel-demo' },
    });

    expect(graph.edges[0]).toEqual({ id: 'edge-0', source: ids.serviceId, target: ids.checkId });
  });

  it('drops invalid icon names rather than passing them to the Icon component', () => {
    const nodes = toDataFrame({
      name: 'nodes',
      fields: [
        { name: 'id', values: ['a'] },
        { name: 'title', values: ['a'] },
        { name: 'subtitle', values: ['Service'] },
        { name: 'icon', values: ['not-a-real-icon'] },
      ],
    });

    const graph = parseGraphFrames([nodes]);

    expect(graph.nodes[0].icon).toBeUndefined();
  });

  it('returns an empty graph when the frames are missing (empty datasource response)', () => {
    expect(parseGraphFrames([])).toEqual({ nodes: [], edges: [] });
  });

  it('degrades missing health fields to a healthy ring instead of throwing', () => {
    const nodes = toDataFrame({
      name: 'nodes',
      fields: [
        { name: 'id', values: ['a'] },
        { name: 'title', values: ['a'] },
        { name: 'subtitle', values: ['Service'] },
      ],
    });

    const graph = parseGraphFrames([nodes]);

    expect(graph.nodes[0].ringSegments).toEqual([{ severity: 'healthy', fraction: 1 }]);
    expect(graph.nodes[0].insightCount).toBe(0);
  });
});

describe('layoutNeighbourhood', () => {
  it('lays out check + upstream on top, the monitored service in the middle, and downstream below', () => {
    const { nodes, edges, ids } = buildNeighbourhoodFrames();
    const graph = parseGraphFrames([nodes, edges]);

    const layout = layoutNeighbourhood(graph);

    const positionOf = (id: string) => layout.nodes.find((n) => n.node.id === id)!;
    const check = positionOf(ids.checkId);
    const upstream = positionOf(ids.upstreamId);
    const service = positionOf(ids.serviceId);
    const downstream = positionOf(ids.downstreamId);

    // Three rows, top to bottom.
    expect(check.y).toBe(upstream.y);
    expect(check.y).toBeLessThan(service.y);
    expect(service.y).toBeLessThan(downstream.y);

    // Every edge gets a path between its endpoints, and the canvas fits all nodes.
    expect(layout.edges).toHaveLength(3);
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(downstream.y);
  });

  it('curves edges between nodes in the same row so they arc over the row instead of cutting through it', () => {
    const buildNode = (id: string, entityType = 'Service'): NeighbourhoodNode => ({
      id,
      name: id,
      entityType,
      icon: undefined,
      insightCount: 0,
      insightNames: [],
      ringSegments: [{ severity: 'healthy', fraction: 1 }],
      scope: { env: 'prod', site: '', namespace: '' },
    });

    const layout = layoutNeighbourhood({
      nodes: [
        buildNode('check', 'SyntheticCheck'),
        buildNode('service'),
        buildNode('downstream-a'),
        buildNode('downstream-b'),
      ],
      edges: [
        { id: 'e1', source: 'check', target: 'service' },
        { id: 'e2', source: 'service', target: 'downstream-a' },
        { id: 'e3', source: 'service', target: 'downstream-b' },
        // Sibling CALLS edge within the bottom row.
        { id: 'e4', source: 'downstream-a', target: 'downstream-b' },
      ],
    });

    const pathOf = (id: string) => layout.edges.find((e) => e.id === id)!.path;

    // Inter-row edges stay orthogonal elbows; the sibling edge becomes a cubic bezier arc.
    expect(pathOf('e2')).not.toContain('C');
    expect(pathOf('e4')).toContain('C');

    // The arc bows above the row: its control points sit higher than the node centers.
    const downstreamA = layout.nodes.find((n) => n.node.id === 'downstream-a')!;
    const controlY = Number(pathOf('e4').split('C')[1].trim().split(' ')[1]);
    expect(controlY).toBeLessThan(downstreamA.y);
  });

  it('handles a check-only response (service not discovered yet) without edges', () => {
    const layout = layoutNeighbourhood({
      nodes: [
        {
          id: 'SyntheticCheck:a',
          name: 'a',
          entityType: 'SyntheticCheck',
          icon: undefined,
          insightCount: 0,
          insightNames: [],
          ringSegments: [{ severity: 'healthy', fraction: 1 }],
          scope: { env: 'unknown', site: '', namespace: '' },
        },
      ],
      edges: [],
    });

    expect(layout.nodes).toHaveLength(1);
    expect(layout.edges).toHaveLength(0);
  });
});

describe('getEntityDrawerUrl', () => {
  function buildNode(overrides: Partial<NeighbourhoodNode> = {}): NeighbourhoodNode {
    return {
      id: 'Service:frontend:prod::otel-demo',
      name: 'frontend',
      entityType: 'Service',
      icon: undefined,
      insightCount: 0,
      insightNames: [],
      ringSegments: [{ severity: 'healthy', fraction: 1 }],
      scope: { env: 'prod', site: '', namespace: 'otel-demo' },
      ...overrides,
    };
  }

  it('builds the KG entity-drawer link with type, name and the non-empty scope values', () => {
    const url = getEntityDrawerUrl(buildNode());

    expect(url).toBe(
      '/a/grafana-asserts-app/entities?ed%5Btype%5D=Service&ed%5Bname%5D=frontend&ed%5Bscope%5D%5Benv%5D=prod&ed%5Bscope%5D%5Bnamespace%5D=otel-demo'
    );
  });

  it('omits empty scope values', () => {
    const url = getEntityDrawerUrl(buildNode({ scope: { env: '', site: '', namespace: '' } }));

    expect(url).toBe('/a/grafana-asserts-app/entities?ed%5Btype%5D=Service&ed%5Bname%5D=frontend');
  });
});
