import { buildServiceNeighbourhoodQuery, escapeCypher, getCheckGraphUrl } from './ConnectedServices.utils';

function paramsOf(url: string): URLSearchParams {
  return new URLSearchParams(url.split('?')[1]);
}

/**
 * The KG link carries a graph search — the searched entity, the entity types it connects
 * out to, and one EQUALS matcher per scope value.
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

