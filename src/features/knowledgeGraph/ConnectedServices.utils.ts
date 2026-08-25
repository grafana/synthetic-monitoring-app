import { DataFrame, Field, toIconName } from '@grafana/data';
import { IconName } from '@grafana/ui';

import { KG_PLUGIN_ID, KG_SERVICE_ENTITY_TYPE, KG_SYNTHETIC_CHECK_ENTITY_TYPE } from './knowledgeGraph';

const NODES_FRAME = 'nodes';
const EDGES_FRAME = 'edges';

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
 * Service, then one hop of CALLS in both directions:
 * - outbound `(s1)-[:CALLS]->(downstream)` — services the monitored service depends on
 * - inbound `(upstream)-[:CALLS]->(s1)` — services that depend on the monitored service
 *
 * Both directions matter for RCA: a failing check could be caused by a broken downstream
 * dependency, or be the cause of failures in an upstream caller. Returning both surfaces
 * red-ringed neighbours either way. We deliberately keep it to a single hop so the graph stays
 * a readable hint rather than the full topology (which lives in the Knowledge Graph app).
 */
export function buildServiceNeighbourhoodQuery(checkEntityName: string): string {
  return [
    `MATCH (sy:SyntheticCheck {name: "${escapeCypher(checkEntityName)}"})<-[:MONITORED_BY]-(s1:Service)`,
    `OPTIONAL MATCH (s1)-[:CALLS]->(downstream:Service)`,
    `OPTIONAL MATCH (upstream:Service)-[:CALLS]->(s1)`,
    `RETURN sy, s1, downstream, upstream`,
  ].join('\n');
}

/**
 * Deep link to the monitored Service's entity page in the Knowledge Graph app, so users can jump
 * from the RCA hint to the full graph. `namespace` is optional; when present it scopes the entity.
 */
export function getServiceEntityUrl(serviceName: string, namespace?: string): string {
  const path = `/a/${KG_PLUGIN_ID}/catalog/${KG_SERVICE_ENTITY_TYPE}/${encodeURIComponent(serviceName)}`;
  return namespace ? `${path}?namespace=${encodeURIComponent(namespace)}` : path;
}

/**
 * Ring severity, ordered by precedence. Maps the KG datasource's arc fields to the same
 * categories the Knowledge Graph uses for its insight rings: critical (arc__errors),
 * warning (arc__warning), info (arc__amend), healthy (no insights).
 */
export type RingSeverity = 'critical' | 'warning' | 'info' | 'healthy';

export interface RingSegment {
  severity: RingSeverity;
  /** Portion of the ring this segment occupies (all of a node's segments sum to 1). */
  fraction: number;
}

export interface NeighbourhoodNode {
  id: string;
  name: string;
  entityType: string;
  /** Grafana icon name emitted by the KG datasource; undefined when unknown/invalid. */
  icon?: IconName;
  insightCount: number;
  insightNames: string[];
  ringSegments: RingSegment[];
  scope: {
    env: string;
    site: string;
    namespace: string;
  };
}

export interface NeighbourhoodEdge {
  id: string;
  source: string;
  target: string;
}

export interface ServiceNeighbourhood {
  nodes: NeighbourhoodNode[];
  edges: NeighbourhoodEdge[];
}

/**
 * Converts the KG datasource's arc fractions into ring segments. The datasource maps insight
 * severities to arcs (critical → arc__errors, warning → arc__warning, info → arc__amend) and
 * splits mixed severities proportionally; a healthy entity gets arc__success=1 which — matching
 * the KG's own graph — we render as a single muted baseline ring rather than green.
 */
export function getRingSegments(arcs: { errors: number; warning: number; amend: number }): RingSegment[] {
  const segments: RingSegment[] = [
    { severity: 'critical' as const, fraction: arcs.errors },
    { severity: 'warning' as const, fraction: arcs.warning },
    { severity: 'info' as const, fraction: arcs.amend },
  ].filter((segment) => segment.fraction > 0);

  if (segments.length === 0) {
    return [{ severity: 'healthy', fraction: 1 }];
  }

  const total = segments.reduce((sum, segment) => sum + segment.fraction, 0);
  return segments.map((segment) => ({ ...segment, fraction: segment.fraction / total }));
}

function findField(frame: DataFrame | undefined, name: string): Field | undefined {
  return frame?.fields.find((field) => field.name === name);
}

function stringAt(field: Field | undefined, index: number): string {
  const value = field?.values[index];
  return value == null ? '' : String(value);
}

function numberAt(field: Field | undefined, index: number): number {
  const value = Number(field?.values[index]);
  return Number.isFinite(value) ? value : 0;
}

/**
 * Parses the node-graph frames the KG datasource returns for a Cypher entityGraph query into a
 * typed model (frame contract from `frames_cypher.go` in the KG plugin: a "nodes" frame with
 * id, title, subtitle, arc fractions, icon, secondarystat, insightNames and scope fields, and an
 * "edges" frame with id, source, target). Tolerant to missing fields — anything absent degrades
 * to a healthy ring / empty value rather than throwing.
 */
export function parseGraphFrames(frames: DataFrame[]): ServiceNeighbourhood {
  const nodesFrame = frames.find((frame) => frame.name === NODES_FRAME);
  const edgesFrame = frames.find((frame) => frame.name === EDGES_FRAME);

  const idField = findField(nodesFrame, 'id');
  const titleField = findField(nodesFrame, 'title');
  const subtitleField = findField(nodesFrame, 'subtitle');
  const iconField = findField(nodesFrame, 'icon');
  const insightCountField = findField(nodesFrame, 'secondarystat');
  const insightNamesField = findField(nodesFrame, 'insightNames');
  const errorsField = findField(nodesFrame, 'arc__errors');
  const warningField = findField(nodesFrame, 'arc__warning');
  const amendField = findField(nodesFrame, 'arc__amend');
  const envField = findField(nodesFrame, 'env');
  const siteField = findField(nodesFrame, 'site');
  const namespaceField = findField(nodesFrame, 'namespace');

  const nodes: NeighbourhoodNode[] = [];
  for (let i = 0; i < (nodesFrame?.length ?? 0); i++) {
    nodes.push({
      id: stringAt(idField, i),
      name: stringAt(titleField, i),
      entityType: stringAt(subtitleField, i),
      icon: toIconName(stringAt(iconField, i)),
      insightCount: numberAt(insightCountField, i),
      insightNames: stringAt(insightNamesField, i).split(',').filter(Boolean),
      ringSegments: getRingSegments({
        errors: numberAt(errorsField, i),
        warning: numberAt(warningField, i),
        amend: numberAt(amendField, i),
      }),
      scope: {
        env: stringAt(envField, i),
        site: stringAt(siteField, i),
        namespace: stringAt(namespaceField, i),
      },
    });
  }

  const edgeIdField = findField(edgesFrame, 'id');
  const sourceField = findField(edgesFrame, 'source');
  const targetField = findField(edgesFrame, 'target');

  const edges: NeighbourhoodEdge[] = [];
  for (let i = 0; i < (edgesFrame?.length ?? 0); i++) {
    edges.push({
      id: stringAt(edgeIdField, i),
      source: stringAt(sourceField, i),
      target: stringAt(targetField, i),
    });
  }

  return { nodes, edges };
}

/**
 * Deep link into the Knowledge Graph app's entity drawer, scoped by env/site/namespace (which
 * disambiguates same-name entities across environments).
 *
 * The `ed` params alone only open the drawer: the KG entities page derives its underlying graph
 * search from `filterCriteria`, not from `ed`, so an ed-only link lands on an empty page with a
 * floating drawer. The `filterCriteria` params mirror what the KG's own "Explore connected
 * entities" → "View Graph" action dispatches (an EQUALS search on name/env/namespace, connected
 * to Services), so the link also populates the graph underneath the drawer.
 */
export function getEntityDrawerUrl(node: NeighbourhoodNode): string {
  const params = new URLSearchParams();
  params.set('ed[type]', node.entityType);
  params.set('ed[name]', node.name);

  if (node.scope.env) {
    params.set('ed[scope][env]', node.scope.env);
  }
  if (node.scope.site) {
    params.set('ed[scope][site]', node.scope.site);
  }
  if (node.scope.namespace) {
    params.set('ed[scope][namespace]', node.scope.namespace);
  }

  params.set('filterCriteria[0][entityType]', node.entityType);
  params.set('filterCriteria[0][connectToEntityTypes][0]', KG_SERVICE_ENTITY_TYPE);

  const matchers: Array<[name: string, value: string]> = [['name', node.name]];
  if (node.scope.env) {
    matchers.push(['env', node.scope.env]);
  }
  if (node.scope.namespace) {
    matchers.push(['namespace', node.scope.namespace]);
  }
  matchers.forEach(([name, value], index) => {
    const prefix = `filterCriteria[0][propertyMatchers][${index}]`;
    params.set(`${prefix}[name]`, name);
    params.set(`${prefix}[type]`, 'String');
    params.set(`${prefix}[op]`, '=');
    params.set(`${prefix}[value]`, value);
  });

  return `/a/${KG_PLUGIN_ID}/entities?${params.toString()}`;
}

// Layout geometry, sized to match the KG's node anatomy (44px nodes, labels beneath).
export const NODE_RADIUS = 22;
const HORIZONTAL_GAP = 132;
const VERTICAL_GAP = 116;
const PADDING_X = 72;
const PADDING_TOP = 32;
/** Extra room under the last row for its labels. */
const PADDING_BOTTOM = 56;
/** Gap between a node's ring and where its edges start/end (the arrowhead sits in this gap). */
const EDGE_NODE_GAP = 6;

export interface PositionedNode {
  node: NeighbourhoodNode;
  x: number;
  y: number;
}

export interface PositionedEdge {
  id: string;
  /** SVG path: an orthogonal elbow from the source node's rim to the target node's rim. */
  path: string;
  /** Endpoint names, for the edge's hover tooltip and accessible label. */
  sourceName: string;
  targetName: string;
}

export interface NeighbourhoodLayout {
  width: number;
  height: number;
  nodes: PositionedNode[];
  edges: PositionedEdge[];
}

/**
 * Deterministic layered layout for the check's neighbourhood, mirroring the KG's
 * "explore connected entities" arrangement: rows top-to-bottom are
 * [check + upstream callers] → [monitored service] → [downstream dependencies].
 * The graph is bounded by the Cypher query (one hop of CALLS around one service), so a fixed
 * 3-row layout always fits — no force simulation or layout dependency needed. Nodes that don't
 * match any known role (future query changes) fall back to the bottom row.
 */
export function layoutNeighbourhood(graph: ServiceNeighbourhood): NeighbourhoodLayout {
  const { nodes, edges } = graph;

  const checkIds = new Set(nodes.filter((n) => n.entityType === KG_SYNTHETIC_CHECK_ENTITY_TYPE).map((n) => n.id));

  // The monitored service is the node connected to the check by an edge (in either direction).
  const serviceIds = new Set<string>();
  for (const edge of edges) {
    if (checkIds.has(edge.source) && !checkIds.has(edge.target)) {
      serviceIds.add(edge.target);
    }
    if (checkIds.has(edge.target) && !checkIds.has(edge.source)) {
      serviceIds.add(edge.source);
    }
  }

  const upstreamIds = new Set<string>();
  const downstreamIds = new Set<string>();
  for (const edge of edges) {
    if (serviceIds.has(edge.target) && !checkIds.has(edge.source) && !serviceIds.has(edge.source)) {
      upstreamIds.add(edge.source);
    }
    if (serviceIds.has(edge.source) && !checkIds.has(edge.target) && !serviceIds.has(edge.target)) {
      downstreamIds.add(edge.target);
    }
  }

  const topRow = nodes.filter((n) => checkIds.has(n.id) || upstreamIds.has(n.id));
  const middleRow = nodes.filter((n) => serviceIds.has(n.id));
  const bottomRow = nodes.filter(
    (n) => !checkIds.has(n.id) && !upstreamIds.has(n.id) && !serviceIds.has(n.id)
  );

  const rows = [topRow, middleRow, bottomRow].filter((row) => row.length > 0);

  const maxRowLength = Math.max(1, ...rows.map((row) => row.length));
  const width = PADDING_X * 2 + (maxRowLength - 1) * HORIZONTAL_GAP;
  const height = PADDING_TOP + NODE_RADIUS + (rows.length - 1) * VERTICAL_GAP + NODE_RADIUS + PADDING_BOTTOM;
  const centerX = width / 2;

  const positioned = new Map<string, PositionedNode>();
  rows.forEach((row, rowIndex) => {
    const y = PADDING_TOP + NODE_RADIUS + rowIndex * VERTICAL_GAP;
    row.forEach((node, colIndex) => {
      const x = centerX + (colIndex - (row.length - 1) / 2) * HORIZONTAL_GAP;
      positioned.set(node.id, { node, x, y });
    });
  });

  const positionedEdges: PositionedEdge[] = [];
  for (const edge of edges) {
    const source = positioned.get(edge.source);
    const target = positioned.get(edge.target);
    if (!source || !target || edge.source === edge.target) {
      continue;
    }
    positionedEdges.push({
      id: edge.id,
      path: buildElbowPath(source, target),
      sourceName: source.node.name,
      targetName: target.node.name,
    });
  }

  return { width, height, nodes: [...positioned.values()], edges: positionedEdges };
}

/**
 * Orthogonal elbow path between two nodes (vertical → horizontal → vertical, like the KG's
 * entity graph edges), starting and ending just outside each node's ring so the arrowhead
 * doesn't overlap it. Same-row edges arc over the row instead — a straight line would cut
 * through any nodes sitting between the endpoints.
 */
function buildElbowPath(source: PositionedNode, target: PositionedNode): string {
  const offset = NODE_RADIUS + EDGE_NODE_GAP;

  if (source.y === target.y) {
    return buildSameRowArcPath(source, target, offset);
  }

  const direction = target.y > source.y ? 1 : -1;
  const startY = source.y + direction * offset;
  const endY = target.y - direction * offset;

  if (source.x === target.x) {
    return `M ${source.x} ${startY} L ${target.x} ${endY}`;
  }

  const midY = (source.y + target.y) / 2;
  return `M ${source.x} ${startY} L ${source.x} ${midY} L ${target.x} ${midY} L ${target.x} ${endY}`;
}

/**
 * Curved arc for an edge between two nodes in the same row (sibling CALLS edges, e.g.
 * checkout → cart). It leaves the source's upper shoulder, bows over the row (deeper for wider
 * spans so stacked arcs separate), and lands on the target's upper shoulder — clear of the
 * straight-through path, the labels beneath the row, and the top-center points where the
 * inter-row elbow arrows land.
 */
function buildSameRowArcPath(source: PositionedNode, target: PositionedNode, offset: number): string {
  const direction = target.x > source.x ? 1 : -1;
  const shoulder = offset * Math.SQRT1_2;
  const startX = source.x + direction * shoulder;
  const endX = target.x - direction * shoulder;
  const shoulderY = source.y - shoulder;

  const span = Math.abs(target.x - source.x);
  // Clamp so wide arcs neither reach the row above nor exit the canvas on the top row.
  const depth = Math.min(48, 28 + span * 0.05, source.y - 8);
  const controlY = source.y - depth;
  const control1X = source.x + direction * span * 0.25;
  const control2X = target.x - direction * span * 0.25;

  return `M ${startX} ${shoulderY} C ${control1X} ${controlY} ${control2X} ${controlY} ${endX} ${shoulderY}`;
}
