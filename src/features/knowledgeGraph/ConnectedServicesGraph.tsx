import React, { useMemo, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Dropdown, Icon, Stack, Text, TextLink, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CONNECTED_SERVICES_TEST_ID, KG_SEVERITY_COLORS } from './ConnectedServices.constants';
import {
  ClassifiedInsight,
  classifyNodeInsights,
  NodeInsightClassification,
  useNeighbourhoodInsightOrigins,
} from './ConnectedServices.origins';
import {
  CheckLinkFanOut,
  getCheckLinkFanOut,
  getEntityDrawerUrl,
  getNodeDisplayName,
  getRepeatedServiceNames,
  getRingSegmentsFromSeverities,
  layoutNeighbourhood,
  NeighbourhoodNode,
  NODE_RADIUS,
  PositionedEdge,
  PositionedNode,
  RingSegment,
  RingSeverity,
  ServiceNeighbourhood,
  wrapLabel,
} from './ConnectedServices.utils';
import { KG_SERVICE_ENTITY_TYPE, KG_SYNTHETIC_CHECK_ENTITY_TYPE } from './knowledgeGraph';
import { logo as smLogo } from 'img';

// Node anatomy mirrors the KG entity graph (44px node: insight rings on the rim, disc inset,
// icon centered, label beneath). The outer ring carries the entity's own insights; a service
// with insights propagated from a check additionally carries an inset connected ring — the same
// own-vs-connected split the KG renders.
const RING_RADIUS = NODE_RADIUS - 2;
const CONNECTED_RING_RADIUS = RING_RADIUS - 4;
const RING_WIDTH = 2;
const DISC_RADIUS = NODE_RADIUS - 7;
/** Smaller disc when the connected ring is present, so the disc doesn't touch it. */
const CONNECTED_DISC_RADIUS = NODE_RADIUS - 9;
const ICON_SIZE = 18;
const LABEL_OFFSET = NODE_RADIUS + 16;
const LABEL_MAX_CHARS = 18;
const LABEL_MAX_LINES = 2;
const LABEL_LINE_HEIGHT = 13;
/** Invisible stroke width around each edge so thin lines are easy to hover. */
const EDGE_HIT_WIDTH = 12;

interface ConnectedServicesGraphProps {
  neighbourhood: ServiceNeighbourhood;
}

/**
 * Renders the check's Knowledge Graph neighbourhood in the style of the KG's own entity graph:
 * circular nodes with severity rings (muted when healthy), an icon disc, name labels beneath,
 * and orthogonal elbow edges between the layered rows. Every node deep-links to its entity in
 * the Knowledge Graph app. Plain SVG — the graph is bounded (one service, one hop), so it needs
 * no pan/zoom or layout engine.
 */
export function ConnectedServicesGraph({ neighbourhood }: ConnectedServicesGraphProps) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const layout = useMemo(() => layoutNeighbourhood(neighbourhood), [neighbourhood]);
  const origins = useNeighbourhoodInsightOrigins(neighbourhood);
  // Own-vs-connected split per service node. Empty while the origins query is loading, errored,
  // or disabled — nodes then fall back to the frame's mixed single ring.
  const classifications = useMemo(() => {
    const byNodeId = new Map<string, NodeInsightClassification>();
    if (origins.data) {
      for (const node of neighbourhood.nodes) {
        if (node.entityType === KG_SERVICE_ENTITY_TYPE) {
          byNodeId.set(node.id, classifyNodeInsights(origins.data, node));
        }
      }
    }
    return byNodeId;
  }, [origins.data, neighbourhood.nodes]);
  // Per check node: the same-named services it links to across multiple environments, so its
  // card can state the fan-out (the env-less MONITORED_BY match) instead of leaving it implied.
  const fanOutByNodeId = useMemo(() => {
    const byNodeId = new Map<string, CheckLinkFanOut[]>();
    for (const node of neighbourhood.nodes) {
      if (node.entityType === KG_SYNTHETIC_CHECK_ENTITY_TYPE) {
        const fanOut = getCheckLinkFanOut(neighbourhood, node);
        if (fanOut.length > 0) {
          byNodeId.set(node.id, fanOut);
        }
      }
    }
    return byNodeId;
  }, [neighbourhood]);
  const repeatedServiceNames = getRepeatedServiceNames(neighbourhood.nodes);
  // Reserve one extra label line without moving any nodes.
  const height = layout.height + (repeatedServiceNames.size > 0 ? LABEL_LINE_HEIGHT : 0);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // SVG paints in document order, so draw the hovered edge after its siblings to lift it
  // out of the tangle (nodes still render on top of all edges).
  const orderedEdges = useMemo(() => {
    if (!hoveredEdgeId) {
      return layout.edges;
    }
    return [...layout.edges].sort((a, b) => Number(a.id === hoveredEdgeId) - Number(b.id === hoveredEdgeId));
  }, [layout.edges, hoveredEdgeId]);

  return (
    <div className={styles.wrapper} data-testid={CONNECTED_SERVICES_TEST_ID.graph}>
      <svg
        width={layout.width}
        height={height}
        viewBox={`0 0 ${layout.width} ${height}`}
        role="img"
        aria-label="Connected services graph"
      >
        {orderedEdges.map((edge) => (
          <EdgePath
            key={edge.id}
            edge={edge}
            theme={theme}
            isHovered={edge.id === hoveredEdgeId}
            isDimmed={hoveredEdgeId !== null && edge.id !== hoveredEdgeId}
            onHoverChange={(hovered) => setHoveredEdgeId(hovered ? edge.id : null)}
          />
        ))}

        {layout.nodes.map((positioned) => (
          <NodeGlyph
            key={positioned.node.id}
            positioned={positioned}
            theme={theme}
            showEnvironment={
              positioned.node.entityType === KG_SERVICE_ENTITY_TYPE &&
              repeatedServiceNames.has(getNodeDisplayName(positioned.node))
            }
            classification={classifications.get(positioned.node.id)}
            originsError={origins.isError && positioned.node.entityType === KG_SERVICE_ENTITY_TYPE}
            fanOut={fanOutByNodeId.get(positioned.node.id)}
          />
        ))}
      </svg>
    </div>
  );
}

interface EdgePathProps {
  edge: PositionedEdge;
  theme: GrafanaTheme2;
  isHovered: boolean;
  isDimmed: boolean;
  onHoverChange: (hovered: boolean) => void;
}

/**
 * One edge: a wide invisible stroke as the hover hit area plus the visible path. Hovering
 * brightens the edge while the rest of the edges fade back, and the native
 * SVG title names the endpoints — the sibling arcs overlap in busy rows,
 * so color alone can't tell them apart.
 */
function EdgePath({ edge, theme, isHovered, isDimmed, onHoverChange }: EdgePathProps) {
  return (
    <g
      data-testid={CONNECTED_SERVICES_TEST_ID.edge}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <title>{`${edge.sourceName} → ${edge.targetName}`}</title>
      <path d={edge.path} fill="none" stroke="transparent" strokeWidth={EDGE_HIT_WIDTH} pointerEvents="stroke" />
      <path
        d={edge.path}
        fill="none"
        stroke={isHovered ? theme.colors.text.primary : theme.colors.border.strong}
        strokeWidth={isHovered ? 2 : 1.5}
        opacity={isDimmed ? 0.3 : 1}
        style={{ transition: 'opacity 100ms ease, stroke 100ms ease' }}
      />
    </g>
  );
}

interface NodeGlyphProps {
  showEnvironment: boolean;
  positioned: PositionedNode;
  theme: GrafanaTheme2;
  /** Own-vs-connected insight split for service nodes; undefined while unknown (loading/error). */
  classification?: NodeInsightClassification;
  originsError: boolean;
  /** For check nodes: same-named services linked across multiple environments. */
  fanOut?: CheckLinkFanOut[];
}

function NodeGlyph({ positioned, theme, showEnvironment, classification, originsError, fanOut }: NodeGlyphProps) {
  const { node, x, y } = positioned;
  const displayName = getNodeDisplayName(node);
  const labelLines = wrapLabel(displayName, LABEL_MAX_CHARS, LABEL_MAX_LINES);
  const environment = node.scope.env && node.scope.env !== 'none' ? node.scope.env : 'not specified';
  const accessibleName = showEnvironment ? `${displayName} · Env: ${environment}` : displayName;

  // With the split known, the outer ring narrows to the node's own insights and the propagated
  // ones move to the inset connected ring — the KG's own anatomy. Without it (loading, error,
  // check nodes), the outer ring keeps the frame's mixed severities and no connected ring shows.
  const ownSegments = classification
    ? getRingSegmentsFromSeverities(classification.own.map((insight) => insight.severity))
    : node.ringSegments;
  const connectedSegments =
    classification && classification.connected.length > 0
      ? getRingSegmentsFromSeverities(classification.connected.map((insight) => insight.severity))
      : null;

  // Click to open, rather than hover: the card carries a link, and a hover card that closes as
  // soon as the cursor strays off the node is hard to reach. Dropdown keeps it open until the
  // next click outside or Escape. The native <title> covers hover, naming a node whose label the
  // layout had to truncate.
  return (
    <Dropdown
      placement="right"
      overlay={
        <NodeInsightsCard node={node} classification={classification} originsError={originsError} fanOut={fanOut} />
      }
    >
      <g
        data-testid={CONNECTED_SERVICES_TEST_ID.node}
        role="button"
        tabIndex={0}
        aria-label={`${accessibleName} (${node.entityType})`}
        style={{ cursor: 'pointer', outline: 'none' }}
      >
        <title>{accessibleName}</title>
        <circle
          cx={x}
          cy={y}
          r={connectedSegments ? CONNECTED_DISC_RADIUS : getDiscRadius(node)}
          fill={getDiscFill(node, theme)}
        />
        <Ring x={x} y={y} segments={ownSegments} theme={theme} />
        {connectedSegments && (
          <g data-testid={CONNECTED_SERVICES_TEST_ID.nodeConnectedRing}>
            <Ring x={x} y={y} segments={connectedSegments} theme={theme} radius={CONNECTED_RING_RADIUS} />
          </g>
        )}
        <NodeIcon node={node} x={x} y={y} />
        <text
          x={x}
          y={y + LABEL_OFFSET}
          textAnchor="middle"
          fontSize={11}
          fill={theme.colors.text.primary}
          // Halo in the section's own background colour, so labels stay readable where they
          // cross an edge.
          style={{ textShadow: `0 0 4px ${theme.colors.background.primary}` }}
        >
          {labelLines.map((line, index) => (
            <tspan key={`${index}-${line}`} x={x} dy={index === 0 ? 0 : LABEL_LINE_HEIGHT}>
              {line}
            </tspan>
          ))}
          {showEnvironment && (
            <tspan x={x} dy={LABEL_LINE_HEIGHT} fill={theme.colors.text.secondary}>
              {`Env: ${wrapLabel(environment, LABEL_MAX_CHARS - 5, 1)[0]}`}
            </tspan>
          )}
        </text>
      </g>
    </Dropdown>
  );
}

interface NodeInsightsCardProps {
  node: NeighbourhoodNode;
  classification?: NodeInsightClassification;
  originsError: boolean;
  fanOut?: CheckLinkFanOut[];
}

/**
 * Popup card shown when a node is clicked: entity identity, its active insights, and the deep
 * link into the Knowledge Graph that node clicks used to navigate to directly. With the
 * own-vs-connected split known, insights group into the service's own and the ones propagated
 * from checks (each with its own severity); without it, the flat list from the frame renders
 * with the node's overall severity. It brings its own surface — Dropdown renders the overlay
 * unstyled.
 */
function NodeInsightsCard({ node, classification, originsError, fanOut }: NodeInsightsCardProps) {
  const styles = useStyles2(getStyles);
  const displayName = getNodeDisplayName(node);
  // The namespace is already in the display name for the entities that carry one; only repeat it
  // in the scope line for the ones it isn't (a check keeps its bare composite name). Scope values
  // are labelled — a bare `deaf98` doesn't say it's the environment.
  const scopeParts = [
    node.scope.env && node.scope.env !== 'unknown' ? `Env: ${node.scope.env}` : '',
    displayName === node.name && node.scope.namespace ? `Namespace: ${node.scope.namespace}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className={styles.card} data-testid={CONNECTED_SERVICES_TEST_ID.nodeCard}>
      <Stack direction="column" gap={0.5}>
        <Text weight="medium">{displayName}</Text>
        <Text variant="bodySmall" color="secondary">
          {scopeParts ? `${node.entityType} · ${scopeParts}` : node.entityType}
        </Text>
        {/* The env-less check matches its service by name+namespace in every environment; when it
            fans out to several twins, say so — the graph alone can't tell which env the check's
            target actually hits. */}
        {fanOut?.map((entry) => (
          <Text key={entry.serviceDisplayName} variant="bodySmall" color="secondary">
            Linked to {entry.serviceDisplayName} in {entry.environments.length} environments:{' '}
            {entry.environments.join(', ')}
          </Text>
        ))}
        {/* Grouped when the split is known — the classification can carry connected insights the
            frame's own insightNames don't list, so it takes precedence over the frame. */}
        {classification && (classification.own.length > 0 || classification.connected.length > 0) ? (
          <>
            {classification.own.length > 0 && <InsightGroup label="Service insights" insights={classification.own} />}
            {classification.connected.length > 0 && (
              <InsightGroup label="Propagated from check" insights={classification.connected} />
            )}
          </>
        ) : node.insightNames.length > 0 ? (
          <ul className={styles.insightList}>
            {node.insightNames.map((insightName) => (
              <InsightRow key={insightName} name={insightName} severity={node.ringSegments[0]?.severity} />
            ))}
          </ul>
        ) : (
          <Text variant="bodySmall" color="secondary">
            No active insights
          </Text>
        )}
        {originsError && (
          <Text variant="bodySmall" color="secondary">
            Insight origin unavailable
          </Text>
        )}
        <TextLink href={getEntityDrawerUrl(node)} variant="bodySmall" external inline>
          Open in Knowledge Graph
        </TextLink>
      </Stack>
    </div>
  );
}

interface InsightGroupProps {
  label: string;
  insights: ClassifiedInsight[];
}

/**
 * One group of the card's insights (the service's own, or the ones propagated from checks),
 * each entry carrying its own severity icon. The group label carries the provenance on its own —
 * this panel always renders alongside a specific check, so rows don't repeat the check name.
 */
function InsightGroup({ label, insights }: InsightGroupProps) {
  const styles = useStyles2(getStyles);

  return (
    <>
      <Text variant="bodySmall" color="secondary" weight="medium">
        {label}
      </Text>
      <ul className={styles.insightList}>
        {insights.map((insight) => (
          <InsightRow key={insight.name} name={insight.name} severity={insight.severity} />
        ))}
      </ul>
    </>
  );
}

interface InsightRowProps {
  name: string;
  severity: RingSeverity | undefined;
}

/**
 * One insight row, matching the KG drawer's anatomy: a severity-colored icon in a fixed gutter
 * with the text in its own column, so the long structured names (`context::AlertName`) wrap
 * under themselves rather than orphaning the icon.
 */
function InsightRow({ name, severity }: InsightRowProps) {
  const styles = useStyles2(getStyles);

  return (
    <li className={styles.insightRow}>
      <Icon
        name="exclamation-triangle"
        size="sm"
        className={styles.insightIcon}
        style={{ color: severityColor(severity) }}
        // The color alone shouldn't carry the severity.
        title={severity ?? 'unknown severity'}
      />
      <div className={styles.insightBody}>{name}</div>
    </li>
  );
}

interface RingProps {
  x: number;
  y: number;
  segments: RingSegment[];
  theme: GrafanaTheme2;
  radius?: number;
}

/**
 * An insight ring around the disc. A healthy node gets a single muted baseline ring (matching
 * the KG's design); insight severities render as proportional arc segments starting at 12
 * o'clock, using the same colors as the KG's rings. The radius selects between the outer
 * (own insights) and inset connected ring.
 */
function Ring({ x, y, segments, theme, radius = RING_RADIUS }: RingProps) {
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <>
      {segments.map((segment, index) => {
        const dashLength = segment.fraction * circumference;
        const dashOffset = -cumulative * circumference;
        cumulative += segment.fraction;

        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r={radius}
            fill="none"
            stroke={getSeverityColor(segment, theme)}
            strokeWidth={RING_WIDTH}
            strokeDasharray={segment.fraction >= 1 ? undefined : `${dashLength} ${circumference}`}
            strokeDashoffset={segment.fraction >= 1 ? undefined : dashOffset}
            transform={`rotate(-90 ${x} ${y})`}
          />
        );
      })}
    </>
  );
}

interface NodeIconProps {
  node: NeighbourhoodNode;
  x: number;
  y: number;
}

function NodeIcon({ node, x, y }: NodeIconProps) {
  // The check node carries the Synthetic Monitoring logo — the KG only offers a generic
  // heart-rate icon for SyntheticCheck entities, and the logo makes the origin unmistakable.
  if (node.entityType === KG_SYNTHETIC_CHECK_ENTITY_TYPE) {
    return (
      <image
        href={smLogo}
        x={x - ICON_SIZE / 2}
        y={y - ICON_SIZE / 2}
        width={ICON_SIZE}
        height={ICON_SIZE}
        aria-hidden="true"
      />
    );
  }

  if (!node.icon) {
    return null;
  }

  // The flex wrapper centers the icon inside the foreignObject box regardless of the icon's
  // intrinsic size (Grafana's "md" icon is 16px inside this 18px box).
  return (
    <foreignObject x={x - ICON_SIZE / 2} y={y - ICON_SIZE / 2} width={ICON_SIZE} height={ICON_SIZE} aria-hidden="true">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        <Icon name={node.icon} size="md" style={{ color: '#fff', display: 'block' }} />
      </div>
    </foreignObject>
  );
}

/**
 * Severity color for the card's per-insight dots. The nodes themselves carry no count badge —
 * matching the KG's entity graph, which encodes severity purely in the rings and leaves the
 * insight enumeration to this card.
 */
function severityColor(severity: RingSeverity | undefined): string {
  if (severity && severity !== 'healthy') {
    return KG_SEVERITY_COLORS[severity];
  }
  return KG_SEVERITY_COLORS.info;
}

function getSeverityColor(segment: RingSegment, theme: GrafanaTheme2): string {
  if (segment.severity === 'healthy') {
    return theme.colors.border.medium;
  }
  return KG_SEVERITY_COLORS[segment.severity];
}

function getDiscRadius(node: NeighbourhoodNode): number {
  // The check node's disc reaches the ring so the logo sits on a clean surface.
  return node.entityType === KG_SYNTHETIC_CHECK_ENTITY_TYPE ? RING_RADIUS - RING_WIDTH / 2 : DISC_RADIUS;
}

function getDiscFill(node: NeighbourhoodNode, theme: GrafanaTheme2): string {
  if (node.entityType === KG_SYNTHETIC_CHECK_ENTITY_TYPE) {
    return theme.colors.background.secondary;
  }
  if (node.entityType === KG_SERVICE_ENTITY_TYPE) {
    return theme.visualization.getColorByName('semi-dark-green');
  }
  return theme.visualization.getColorByName('semi-dark-blue');
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    justifyContent: 'center',
    overflowX: 'auto',
    // No surface of its own: the graph sits directly on the section's background so the
    // section reads as one panel. Horizontal padding comes from the section body.
    padding: theme.spacing(1, 0),
  }),
  card: css({
    background: theme.colors.background.elevated ?? theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    boxShadow: theme.shadows.z3,
    padding: theme.spacing(1, 1.5),
    maxWidth: 320,
    // Entity names run long (`namespace/service`, `job__target`) and have no spaces to break on.
    overflowWrap: 'anywhere',
  }),
  insightList: css({
    listStyle: 'none',
    margin: 0,
    padding: 0,
    fontSize: theme.typography.bodySmall.fontSize,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.75),
  }),
  insightRow: css({
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(0.75),
  }),
  insightIcon: css({
    flexShrink: 0,
    // Optically aligns the icon with the first text line of a wrapping name.
    marginTop: 2,
  }),
  insightBody: css({
    flex: 1,
    minWidth: 0,
    overflowWrap: 'anywhere',
  }),
});
