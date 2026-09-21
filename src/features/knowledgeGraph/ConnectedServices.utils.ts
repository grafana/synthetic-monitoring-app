import { KG_PLUGIN_ID, KG_SERVICE_ENTITY_TYPE, KG_SYNTHETIC_CHECK_ENTITY_TYPE } from './knowledgeGraph';

/**
 * Escape values interpolated into a Cypher string so a target/job containing quotes or
 * backslashes can't break (or inject into) the query.
 */
export function escapeCypher(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Builds the Cypher query for a check's service neighbourhood.
 *
 * Starting from the SyntheticCheck entity, it walks the MONITORED_BY relationship (Service
 * MONITORED_BY check — the direction the KG's insight propagation expects) to the linked
 * Service, then one hop of CALLS in either direction. Both directions matter for RCA: a failing
 * check could be caused by a broken downstream dependency, or be the cause of failures in an
 * upstream caller. Returning both surfaces red-ringed neighbours either way. We deliberately
 * keep it to a single hop so the graph stays a readable hint rather than the full topology
 * (which lives in the Knowledge Graph app).
 *
 * The CALLS hop is matched undirected rather than as two directed OPTIONAL MATCHes: some KG
 * versions answer `OPTIONAL MATCH (s1)<-[:CALLS]-(upstream:Service)` with a 500 (the whole
 * section then fails), while the undirected form is answered everywhere. Direction is not lost —
 * the KG derives it from each edge's source/target.
 */
export function buildServiceNeighbourhoodQuery(checkEntityName: string): string {
  return [
    `MATCH (sy:SyntheticCheck {name: "${escapeCypher(checkEntityName)}"})<-[:MONITORED_BY]-(s1:Service)`,
    `OPTIONAL MATCH (s1)-[:CALLS]-(neighbour:Service)`,
    `RETURN sy, s1, neighbour`,
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
 * Deep link to this check's neighbourhood in the Knowledge Graph's entity graph — the same
 * entities this section renders, in the app that owns them.
 *
 * The search is anchored on the check, connected to Services, so the graph opens on exactly the
 * services this check monitors. Anchoring on the monitored service instead would open that
 * service's own neighbourhood, which is a different (and wider) set.
 *
 * It deliberately doesn't link to the Service's entity page (`/catalog/Service/<name>`): that page
 * is behind the KG's own feature gating, so on stacks without it the link lands on an empty
 * "entity not found" page. The entity graph is available everywhere.
 */
export function getCheckGraphUrl(checkEntityName: string): string {
  const params = new URLSearchParams();
  appendGraphSearchParams(params, {
    entityType: KG_SYNTHETIC_CHECK_ENTITY_TYPE,
    name: checkEntityName,
    scope: {},
    connectToEntityTypes: [KG_SERVICE_ENTITY_TYPE],
  });

  return `/a/${KG_PLUGIN_ID}/entities?${toQueryString(params)}`;
}

/** Characters a graph label prefers to break after, so wrapped lines split on name boundaries. */
const LABEL_BREAK_CHARS = new Set([' ', '/', '-', '_', '.', ':']);

/**
 * Wraps a label into at most `maxLines` lines of `maxChars`, breaking after the last
 * separator that fits (falling back to a hard break for a single unbroken token) and ellipsizing
 * whatever doesn't fit. Entity names here are long and structured — `namespace/name` for services,
 * `job__target` for checks — so breaking on their separators keeps both halves readable.
 */
export function wrapLabel(text: string, maxChars: number, maxLines: number): string[] {
  const lines: string[] = [];
  let rest = text;

  while (rest.length > 0 && lines.length < maxLines) {
    if (rest.length <= maxChars) {
      lines.push(rest);
      return lines;
    }

    if (lines.length === maxLines - 1) {
      lines.push(`${rest.slice(0, maxChars - 1)}…`);
      return lines;
    }

    let breakAt = maxChars;
    for (let i = maxChars - 1; i > 0; i--) {
      if (LABEL_BREAK_CHARS.has(rest[i])) {
        breakAt = i + 1;
        break;
      }
    }

    lines.push(rest.slice(0, breakAt).trimEnd());
    rest = rest.slice(breakAt).trimStart();
  }

  return lines;
}
