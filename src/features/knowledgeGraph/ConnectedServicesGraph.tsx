import React, { useMemo, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Dropdown, Icon, Stack, Text, TextLink, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CONNECTED_SERVICES_TEST_ID, KG_SEVERITY_COLORS } from './ConnectedServices.constants';
import {
  getEntityDrawerUrl,
  getNodeDisplayName,
  layoutNeighbourhood,
  NeighbourhoodNode,
  NODE_RADIUS,
  PositionedEdge,
  PositionedNode,
  RingSegment,
  ServiceNeighbourhood,
  wrapLabel,
} from './ConnectedServices.utils';
import { KG_SERVICE_ENTITY_TYPE, KG_SYNTHETIC_CHECK_ENTITY_TYPE } from './knowledgeGraph';
import { logo as smLogo } from 'img';

// Node anatomy mirrors the KG entity graph (44px node: insight ring on the rim, disc inset,
// icon centered, label beneath).
const RING_RADIUS = NODE_RADIUS - 2;
const RING_WIDTH = 2;
const DISC_RADIUS = NODE_RADIUS - 7;
const ICON_SIZE = 18;
const BADGE_RADIUS = 9;
const LABEL_OFFSET = NODE_RADIUS + 16;
const LABEL_MAX_CHARS = 18;
const LABEL_MAX_LINES = 2;
const LABEL_LINE_HEIGHT = 13;
const ARROW_ID = 'connected-services-arrow';
const ARROW_HOVER_ID = 'connected-services-arrow-hover';
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
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img"
        aria-label="Connected services graph"
      >
        <defs>
          <ArrowMarker id={ARROW_ID} fill={theme.colors.border.strong} />
          <ArrowMarker id={ARROW_HOVER_ID} fill={theme.colors.text.primary} />
        </defs>

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
          <NodeGlyph key={positioned.node.id} positioned={positioned} theme={theme} />
        ))}
      </svg>
    </div>
  );
}

function ArrowMarker({ id, fill }: { id: string; fill: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill={fill} />
    </marker>
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
 * brightens the edge and its arrowhead while the rest of the edges fade back, and the native
 * SVG title names the connection ("checkout → cart") — the sibling arcs overlap in busy rows,
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
        markerEnd={`url(#${isHovered ? ARROW_HOVER_ID : ARROW_ID})`}
        style={{ transition: 'opacity 100ms ease, stroke 100ms ease' }}
      />
    </g>
  );
}

interface NodeGlyphProps {
  positioned: PositionedNode;
  theme: GrafanaTheme2;
}

function NodeGlyph({ positioned, theme }: NodeGlyphProps) {
  const { node, x, y } = positioned;
  const displayName = getNodeDisplayName(node);
  const labelLines = wrapLabel(displayName, LABEL_MAX_CHARS, LABEL_MAX_LINES);

  // Click to open, rather than hover: the card carries a link, and a hover card that closes as
  // soon as the cursor strays off the node is hard to reach. Dropdown keeps it open until the
  // next click outside or Escape. The native <title> covers hover, naming a node whose label the
  // layout had to truncate.
  return (
    <Dropdown placement="right" overlay={<NodeInsightsCard node={node} />}>
      <g
        data-testid={CONNECTED_SERVICES_TEST_ID.node}
        role="button"
        tabIndex={0}
        aria-label={`${displayName} (${node.entityType})`}
        style={{ cursor: 'pointer', outline: 'none' }}
      >
        <title>{displayName}</title>
        <circle cx={x} cy={y} r={getDiscRadius(node)} fill={getDiscFill(node, theme)} />
        <Ring x={x} y={y} segments={node.ringSegments} theme={theme} />
        <NodeIcon node={node} x={x} y={y} />
        {node.insightCount > 0 && <InsightBadge x={x} y={y} node={node} />}
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
        </text>
      </g>
    </Dropdown>
  );
}

interface NodeInsightsCardProps {
  node: NeighbourhoodNode;
}

/**
 * Popup card shown when a node is clicked: entity identity, its active insights (the Cypher
 * response carries insight names and the node's overall severity, not per-insight severities),
 * and the deep link into the Knowledge Graph that node clicks used to navigate to directly.
 * It brings its own surface — Dropdown renders the overlay unstyled.
 */
function NodeInsightsCard({ node }: NodeInsightsCardProps) {
  const styles = useStyles2(getStyles);
  const displayName = getNodeDisplayName(node);
  // The namespace is already in the display name for the entities that carry one; only repeat it
  // in the scope line for the ones it isn't (a check keeps its bare composite name).
  const scopeParts = [
    node.scope.env && node.scope.env !== 'unknown' ? node.scope.env : '',
    displayName === node.name ? node.scope.namespace : '',
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
        {node.insightNames.length > 0 ? (
          <ul className={styles.insightList}>
            {node.insightNames.map((insightName) => (
              <li key={insightName}>
                <span className={styles.insightDot} style={{ background: severityBadgeFill(node.ringSegments[0]) }} />
                {insightName}
              </li>
            ))}
          </ul>
        ) : (
          <Text variant="bodySmall" color="secondary">
            No active insights
          </Text>
        )}
        <TextLink href={getEntityDrawerUrl(node)} variant="bodySmall" icon="external-link-alt" inline>
          Open in Knowledge Graph
        </TextLink>
      </Stack>
    </div>
  );
}

interface RingProps {
  x: number;
  y: number;
  segments: RingSegment[];
  theme: GrafanaTheme2;
}

/**
 * The insight ring around the disc. A healthy node gets a single muted baseline ring (matching
 * the KG's design); insight severities render as proportional arc segments starting at 12
 * o'clock, using the same colors as the KG's rings.
 */
function Ring({ x, y, segments, theme }: RingProps) {
  const circumference = 2 * Math.PI * RING_RADIUS;
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
            r={RING_RADIUS}
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
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
      >
        <Icon name={node.icon} size="md" style={{ color: '#fff', display: 'block' }} />
      </div>
    </foreignObject>
  );
}

interface InsightBadgeProps {
  x: number;
  y: number;
  node: NeighbourhoodNode;
}

/** Insight count in a severity-colored badge at the node's top-right, like the KG's node badges. */
function InsightBadge({ x, y, node }: InsightBadgeProps) {
  const severity = node.ringSegments[0];
  const badgeX = x + NODE_RADIUS - 4;
  const badgeY = y - NODE_RADIUS + 4;

  return (
    <g>
      <circle cx={badgeX} cy={badgeY} r={BADGE_RADIUS} fill={severityBadgeFill(severity)} />
      <text x={badgeX} y={badgeY + 3} textAnchor="middle" fontSize={10} fontWeight={600} fill="#fff">
        {node.insightCount}
      </text>
    </g>
  );
}

function severityBadgeFill(segment: RingSegment | undefined): string {
  if (segment && segment.severity !== 'healthy') {
    return KG_SEVERITY_COLORS[segment.severity];
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
    gap: theme.spacing(0.5),
  }),
  insightDot: css({
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: theme.shape.radius.circle,
    marginRight: theme.spacing(0.75),
  }),
});
