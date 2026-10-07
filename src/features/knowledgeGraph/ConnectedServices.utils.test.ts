import { buildEntityNeighbourhoodQuery, escapeCypher, getCheckGraphUrl } from './ConnectedServices.utils';

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

describe('buildEntityNeighbourhoodQuery', () => {
  it('serializes bound zero-hop and service-only one-hop branches at the selected end time', () => {
    // This checks the query contract, not KG execution; retention also needs live API validation.
    expect(buildEntityNeighbourhoodQuery('check"\\__https://example.com', 2000)).toBe(
      [
        'MATCH (sy:SyntheticCheck {name: "check\\"\\\\__https://example.com"})<-[monitored:MONITORED_BY]-(entity)',
        'WHERE (entity:Service OR entity:Frontend)',
        'AND (monitored._created IS NULL OR monitored._created <= 2000)',
        'AND (monitored._expired IS NULL OR monitored._expired > 2000)',
        'RETURN sy, entity, entity AS neighbour',
        'UNION',
        'MATCH (sy:SyntheticCheck {name: "check\\"\\\\__https://example.com"})<-[monitored:MONITORED_BY]-(entity)',
        'WHERE (entity:Service OR entity:Frontend)',
        'AND (monitored._created IS NULL OR monitored._created <= 2000)',
        'AND (monitored._expired IS NULL OR monitored._expired > 2000)',
        'MATCH (entity:Service)-[calls:CALLS]-(neighbour:Service)',
        'WHERE (calls._created IS NULL OR calls._created <= 2000)',
        'AND (calls._expired IS NULL OR calls._expired > 2000)',
        'RETURN sy, entity, neighbour',
      ].join('\n')
    );
  });
});

describe('getCheckGraphUrl', () => {
  it('anchors the KG entity graph on the check, connected to the services and frontends it monitors', () => {
    const url = getCheckGraphUrl('grafana.com homepage__https://grafana.com/', 1000, 2000);

    expect(url.startsWith('/a/grafana-asserts-app/entities?')).toBe(true);
    // A space in the check name encodes as %20, not the form-encoded +.
    expect(url).toContain('grafana.com%20homepage');
    const params = paramsOf(url);
    expect(params.get('filterCriteria[1][entityType]')).toBe('Service');
    expect(params.get('filterCriteria[1][connectToEntityTypes][0]')).toBe('Service');
    expect(params.get('filterCriteria[1][propertyMatchers][0][op]')).toBe('IS NOT NULL');
    // Both connected types need an explicit criterion: KG then expands each independently,
    // retaining service-only and frontend-only checks instead of requiring both edges.
    expect(params.get('filterCriteria[2][entityType]')).toBe('Frontend');
    expect(params.get('filterCriteria[2][propertyMatchers][0][name]')).toBe('name');
    expect(params.get('filterCriteria[2][propertyMatchers][0][op]')).toBe('IS NOT NULL');
    expect(params.get('start')).toBe('1000');
    expect(params.get('end')).toBe('2000');

    // The first criterion still anchors the search on this check.
    expectGraphSearch(
      paramsOf(url),
      'SyntheticCheck',
      [['name', 'grafana.com homepage__https://grafana.com/']],
      ['Service', 'Frontend']
    );
  });
});
