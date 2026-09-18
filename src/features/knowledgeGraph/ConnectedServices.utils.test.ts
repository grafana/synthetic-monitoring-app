import { toDataFrame } from '@grafana/data';
import { buildNeighbourhoodFrames } from 'test/fixtures/knowledgeGraph';

import {
  buildServiceNeighbourhoodQuery,
  escapeCypher,
  getCheckGraphUrl,
  getEntityDrawerUrl,
  getNodeDisplayName,
  getRingSegments,
  layoutNeighbourhood,
  NeighbourhoodNode,
  parseGraphFrames,
  wrapLabel,
} from './ConnectedServices.utils';

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

function paramsOf(url: string): URLSearchParams {
  return new URLSearchParams(url.split('?')[1]);
}

/**
 * Both KG links carry the same graph search — the searched entity, the entity types it connects
 * out to, and one EQUALS matcher per scope value — so its shape is asserted in one place.
 */
function expectGraphSearch(
  params: URLSearchParams,
  entityType: string,
  matchers: Array<[string, string]>,
  connectToEntityTypes: string[]
) {
  expect(params.get('filterCriteria[0][entityType]')).toBe(entityType);
  expect(params.get('view')).toBe('graph');

  connectToEntityTypes.forEach((connectTo, index) => {
    expect(params.get(`filterCriteria[0][connectToEntityTypes][${index}]`)).toBe(connectTo);
  });
  expect(params.get(`filterCriteria[0][connectToEntityTypes][${connectToEntityTypes.length}]`)).toBeNull();

  matchers.forEach(([name, value], index) => {
    const prefix = `filterCriteria[0][propertyMatchers][${index}]`;
    expect(params.get(`${prefix}[name]`)).toBe(name);
    expect(params.get(`${prefix}[value]`)).toBe(value);
    expect(params.get(`${prefix}[op]`)).toBe('=');
    expect(params.get(`${prefix}[type]`)).toBe('String');
  });

  // Nothing beyond the expected matchers: empty scope values are left out entirely.
  expect(params.get(`filterCriteria[0][propertyMatchers][${matchers.length}][name]`)).toBeNull();
}

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
    // Undirected, so it picks up both the services this one calls and the ones that call it. The
    // directed inbound form is answered with a 500 by some KG versions.
    expect(query).toContain('OPTIONAL MATCH (s1)-[:CALLS]-(neighbour:Service)');
    expect(query).not.toContain('->(downstream:Service)');
    expect(query).toContain('RETURN sy, s1, neighbour');
  });

  it('escapes the entity name it interpolates', () => {
    const query = buildServiceNeighbourhoodQuery('evil"} DETACH DELETE n //');

    expect(query).toContain('{name: "evil\\"} DETACH DELETE n //"}');
  });
});

describe('getCheckGraphUrl', () => {
  it('anchors the KG entity graph on the check, connected to the services it monitors', () => {
    const url = getCheckGraphUrl('grafana.com homepage__https://grafana.com/');

    expect(url.startsWith('/a/grafana-asserts-app/entities?')).toBe(true);
    // A space in the check name encodes as %20, not the form-encoded +.
    expect(url).toContain('grafana.com%20homepage');

    // Anchoring on the monitored service instead would open that service's own neighbourhood,
    // which is a wider set than the services this check monitors.
    expectGraphSearch(
      paramsOf(url),
      'SyntheticCheck',
      [['name', 'grafana.com homepage__https://grafana.com/']],
      ['Service']
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
    const buildRowNode = (id: string, entityType = 'Service') =>
      buildNode({ id, name: id, entityType, scope: { env: 'prod', site: '', namespace: '' } });

    const layout = layoutNeighbourhood({
      nodes: [
        buildRowNode('check', 'SyntheticCheck'),
        buildRowNode('service'),
        buildRowNode('downstream-a'),
        buildRowNode('downstream-b'),
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
        buildNode({
          id: 'SyntheticCheck:a',
          name: 'a',
          entityType: 'SyntheticCheck',
          scope: { env: 'unknown', site: '', namespace: '' },
        }),
      ],
      edges: [],
    });

    expect(layout.nodes).toHaveLength(1);
    expect(layout.edges).toHaveLength(0);
  });
});

describe('getEntityDrawerUrl', () => {
  it('builds the KG entity-drawer link with type, name and the non-empty scope values', () => {
    const url = getEntityDrawerUrl(buildNode());
    const params = paramsOf(url);

    expect(url.startsWith('/a/grafana-asserts-app/entities?')).toBe(true);
    expect(params.get('ed[type]')).toBe('Service');
    expect(params.get('ed[name]')).toBe('frontend');
    expect(params.get('ed[scope][env]')).toBe('prod');
    expect(params.get('ed[scope][namespace]')).toBe('otel-demo');
    expect(params.get('ed[scope][site]')).toBeNull();
  });

  it('searches the graph for the node, scoped by its env and namespace', () => {
    // A service also connects out to the check monitoring it, so its graph opens with the check.
    expectGraphSearch(
      paramsOf(getEntityDrawerUrl(buildNode())),
      'Service',
      [
        ['name', 'frontend'],
        ['env', 'prod'],
        ['namespace', 'otel-demo'],
      ],
      ['Service', 'SyntheticCheck']
    );
  });

  it('connects a check out to services only, matching the section header link', () => {
    const check = buildNode({
      name: 'my check__https://grafana.com',
      entityType: 'SyntheticCheck',
      scope: { env: 'unknown', site: '', namespace: '' },
    });

    expectGraphSearch(
      paramsOf(getEntityDrawerUrl(check)),
      'SyntheticCheck',
      [
        ['name', 'my check__https://grafana.com'],
        ['env', 'unknown'],
      ],
      ['Service']
    );
  });

  it('omits empty scope values from both the drawer params and the search matchers', () => {
    const params = paramsOf(getEntityDrawerUrl(buildNode({ scope: { env: '', site: '', namespace: '' } })));

    expect(params.get('ed[type]')).toBe('Service');
    expect(params.get('ed[name]')).toBe('frontend');
    expect(params.get('ed[scope][env]')).toBeNull();
    expect(params.get('ed[scope][site]')).toBeNull();
    expect(params.get('ed[scope][namespace]')).toBeNull();

    expectGraphSearch(params, 'Service', [['name', 'frontend']], ['Service', 'SyntheticCheck']);
  });
});

describe('getNodeDisplayName', () => {
  it('prefixes a namespaced entity with its namespace, the way the Knowledge Graph does', () => {
    expect(getNodeDisplayName(buildNode())).toBe('otel-demo/frontend');
  });

  it('leaves an entity without a namespace as its bare name', () => {
    expect(getNodeDisplayName(buildNode({ scope: { env: 'prod', site: '', namespace: '' } }))).toBe('frontend');
  });

  it('never prefixes a check: its composite name is the identity, and it carries no otel namespace', () => {
    const check = buildNode({
      name: 'my check__https://grafana.com',
      entityType: 'SyntheticCheck',
      scope: { env: 'unknown', site: '', namespace: 'otel-demo' },
    });

    expect(getNodeDisplayName(check)).toBe('my check__https://grafana.com');
  });
});

describe('wrapLabel', () => {
  it('leaves a label that fits on one line', () => {
    expect(wrapLabel('frontend', 18, 2)).toEqual(['frontend']);
  });

  it('breaks after the last separator that fits, so the split lands on a name boundary', () => {
    expect(wrapLabel('local-lab/local-kg-lab-web', 18, 2)).toEqual(['local-lab/local-', 'kg-lab-web']);
    expect(wrapLabel('my check__https://grafana.com', 18, 2)).toEqual(['my check__https://', 'grafana.com']);
  });

  it('hard-breaks a single unbroken token', () => {
    expect(wrapLabel('abcdefghijklmnopqrstuvwxyz', 10, 2)).toEqual(['abcdefghij', 'klmnopqrs…']);
  });

  it('ellipsizes whatever does not fit in the allowed lines', () => {
    expect(wrapLabel('local-lab/local-kg-lab-web-frontend-checkout', 18, 2)).toEqual([
      'local-lab/local-',
      'kg-lab-web-fronte…',
    ]);
  });
});
