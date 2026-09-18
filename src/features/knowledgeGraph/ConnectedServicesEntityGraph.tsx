import React, { useCallback } from 'react';
import { usePluginComponent } from '@grafana/runtime';
import { useTimeRange } from '@grafana/scenes-react';

import { Check } from 'types';

import { CONNECTED_SERVICES_TEST_ID } from './ConnectedServices.constants';
import { buildServiceNeighbourhoodQuery, getEntityDrawerUrl, NeighbourhoodNode } from './ConnectedServices.utils';
import { getSyntheticCheckEntityName, KG_ENTITY_GRAPH_COMPONENT_ID } from './knowledgeGraph';

// Height chosen to match the section's reserved loading height so the layout doesn't jump
// between the loading state and the rendered graph.
const GRAPH_HEIGHT = 280;

/**
 * A node as emitted by the exposed Entity Graph's `onNodeClick` (see `EntityGraphProps` in
 * asserts-app-plugin's `externalComponents/types.ts`). Declared locally, like the assertions
 * widget's props in `KnowledgeGraphInsights.tsx` — the SM app doesn't depend on asserts types.
 */
export interface ExposedEntityGraphNode {
  id: string;
  name: string;
  type: string;
  scope?: Record<string, string>;
  properties: Record<string, unknown>;
}

/** Props contract of the `grafana-asserts-app/entity-graph/v1` exposed component. */
export interface ExposedEntityGraphProps {
  cypherQuery: string;
  start: number | string;
  end: number | string;
  height: number | string;
  nodeLimit?: number;
  nodeFilter?: (node: ExposedEntityGraphNode) => boolean;
  onNodeClick?: (node: ExposedEntityGraphNode) => void;
}

/**
 * Resolves the Knowledge Graph's exposed Entity Graph component. Null on stacks whose asserts
 * app predates the exposure — callers fall back to the SM-owned graph renderer.
 */
export function useExposedEntityGraph() {
  return usePluginComponent<ExposedEntityGraphProps>(KG_ENTITY_GRAPH_COMPONENT_ID);
}

interface ConnectedServicesEntityGraphProps {
  check: Check;
  EntityGraph: React.ComponentType<ExposedEntityGraphProps>;
}

/**
 * The check's service neighbourhood rendered by the Knowledge Graph's own exposed Entity Graph
 * component: same Cypher query as the SM-owned renderer, but the KG app owns fetching, insight
 * rings (including the own-vs-connected split), and loading/error/empty states — so the panel
 * stays visually consistent with the KG by construction. Node clicks deep-link into the KG
 * entity drawer in a new tab; richer in-place cards remain with the fallback renderer until the
 * exposed component grows a tooltip/card of its own.
 */
export function ConnectedServicesEntityGraph({ check, EntityGraph }: ConnectedServicesEntityGraphProps) {
  const [timeRange] = useTimeRange();

  const handleNodeClick = useCallback((node: ExposedEntityGraphNode) => {
    window.open(getEntityDrawerUrl(toNeighbourhoodNode(node)), '_blank', 'noopener');
  }, []);

  return (
    <div data-testid={CONNECTED_SERVICES_TEST_ID.exposedGraph}>
      <EntityGraph
        cypherQuery={buildServiceNeighbourhoodQuery(getSyntheticCheckEntityName(check))}
        start={timeRange.from.valueOf()}
        end={timeRange.to.valueOf()}
        height={GRAPH_HEIGHT}
        onNodeClick={handleNodeClick}
      />
    </div>
  );
}

/** Adapts an exposed-graph node to the shape the SM deep-link builder expects. */
function toNeighbourhoodNode(node: ExposedEntityGraphNode): NeighbourhoodNode {
  return {
    id: node.id,
    name: node.name,
    entityType: node.type,
    icon: undefined,
    insightCount: 0,
    insightNames: [],
    ringSegments: [{ severity: 'healthy', fraction: 1 }],
    scope: {
      env: node.scope?.env ?? '',
      site: node.scope?.site ?? '',
      namespace: node.scope?.namespace ?? '',
    },
  };
}
