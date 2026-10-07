import {
  KG_FRONTEND_ENTITY_TYPE,
  KG_PLUGIN_ID,
  KG_SERVICE_ENTITY_TYPE,
  KG_SYNTHETIC_CHECK_ENTITY_TYPE,
} from './knowledgeGraph';

/**
 * Escape values interpolated into a Cypher string so a target/job containing quotes or
 * backslashes can't break (or inject into) the query.
 */
export function escapeCypher(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Show the services and frontends monitored by this check. Expand services to their immediate
 * callers/dependencies, retaining frontends and services that have no CALLS neighbours.
 * The Cypher endpoint time-filters returned nodes, but traverses expired relationships too.
 * Restrict traversal to the topology at the selected range's end so an unlinked service stops
 * appearing in current views while historical views can still show its former connection.
 */
export function buildEntityNeighbourhoodQuery(checkEntityName: string, end: number): string {
  return [
    `MATCH (sy:SyntheticCheck {name: "${escapeCypher(checkEntityName)}"})<-[monitored:MONITORED_BY]-(entity)`,
    `WHERE (entity:Service OR entity:Frontend)`,
    `AND (monitored._created IS NULL OR monitored._created <= ${end})`,
    `AND (monitored._expired IS NULL OR monitored._expired > ${end})`,
    `OPTIONAL MATCH (entity:Service)-[calls:CALLS]-(neighbour:Service)`,
    `WHERE (calls._created IS NULL OR calls._created <= ${end})`,
    `AND (calls._expired IS NULL OR calls._expired > ${end})`,
    `RETURN sy, entity, neighbour`,
  ].join('\n');
}

interface GraphSearchTarget {
  entityType: string;
  name: string;
  scope: { env?: string; namespace?: string };
  /** Entity types to pull in around the searched entity. */
  connectToEntityTypes: string[];
}

/**
 * The KG entities page derives its graph from `filterCriteria`, so these params are what actually
 * populate the graph. Shape and semantics mirror the KG's own "Explore connected entities" →
 * "See in entity graph" action (`ConnectedEntitiesModal`): an EQUALS search on name, plus env and
 * namespace matchers when the entity is scoped, expanded to the connected entity types. `view`
 * makes the graph explicit rather than relying on the entities page's default.
 */
function appendGraphSearchParams(params: URLSearchParams, target: GraphSearchTarget): void {
  params.set('filterCriteria[0][entityType]', target.entityType);

  target.connectToEntityTypes.forEach((entityType, index) => {
    params.set(`filterCriteria[0][connectToEntityTypes][${index}]`, entityType);
  });

  const matchers: Array<[name: string, value: string]> = [['name', target.name]];
  if (target.scope.env) {
    matchers.push(['env', target.scope.env]);
  }
  if (target.scope.namespace) {
    matchers.push(['namespace', target.scope.namespace]);
  }
  matchers.forEach(([name, value], index) => {
    const prefix = `filterCriteria[0][propertyMatchers][${index}]`;
    params.set(`${prefix}[name]`, name);
    params.set(`${prefix}[type]`, 'String');
    params.set(`${prefix}[op]`, '=');
    params.set(`${prefix}[value]`, value);
  });

  params.set('view', 'graph');
}

/**
 * `URLSearchParams` serializes a space as `+` (form encoding). That decodes correctly in the KG's
 * query-string parser, but `%20` is unambiguous everywhere — and check entity names, which are
 * `job__target`, routinely contain spaces.
 */
function toQueryString(params: URLSearchParams): string {
  return params.toString().replace(/\+/g, '%20');
}

/**
 * Open the check, its monitored services and frontends, and its services' neighbours. Environment
 * selection stays inside the exposed mini graph, so this link opens across environments.
 */
export function getCheckGraphUrl(checkEntityName: string, start: number, end: number): string {
  const params = new URLSearchParams();
  appendGraphSearchParams(params, {
    entityType: KG_SYNTHETIC_CHECK_ENTITY_TYPE,
    name: checkEntityName,
    scope: {},
    connectToEntityTypes: [KG_SERVICE_ENTITY_TYPE, KG_FRONTEND_ENTITY_TYPE],
  });
  // Give each connected type its own criterion so KG expands both branches with OPTIONAL MATCH.
  // Leaving Frontend only in connectToEntityTypes would require a frontend edge to find the check.
  // A self filter retains monitored services with no neighbours (the API uses zero-or-one hop).
  params.set('filterCriteria[1][entityType]', KG_SERVICE_ENTITY_TYPE);
  params.set('filterCriteria[1][connectToEntityTypes][0]', KG_SERVICE_ENTITY_TYPE);
  params.set('filterCriteria[1][propertyMatchers][0][name]', 'name');
  params.set('filterCriteria[1][propertyMatchers][0][op]', 'IS NOT NULL');
  params.set('filterCriteria[1][propertyMatchers][0][type]', 'String');
  params.set('filterCriteria[1][propertyMatchers][0][value]', '');
  params.set('filterCriteria[2][entityType]', KG_FRONTEND_ENTITY_TYPE);
  params.set('filterCriteria[2][propertyMatchers][0][name]', 'name');
  params.set('filterCriteria[2][propertyMatchers][0][op]', 'IS NOT NULL');
  params.set('filterCriteria[2][propertyMatchers][0][type]', 'String');
  params.set('filterCriteria[2][propertyMatchers][0][value]', '');
  params.set('start', String(start));
  params.set('end', String(end));

  return `/a/${KG_PLUGIN_ID}/entities?${toQueryString(params)}`;
}
