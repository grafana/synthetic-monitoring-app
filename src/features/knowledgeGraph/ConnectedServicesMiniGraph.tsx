import React from 'react';
import { usePluginComponent } from '@grafana/runtime';
import { useTimeRange } from '@grafana/scenes-react';

import { Check } from 'types';

import { CONNECTED_SERVICES_TEST_ID } from './ConnectedServices.constants';
import { buildServiceNeighbourhoodQuery } from './ConnectedServices.utils';
import {
  getSyntheticCheckEntityName,
  KG_ENTITY_GRAPH_COMPONENT_ID,
  KG_SYNTHETIC_CHECK_ENTITY_TYPE,
} from './knowledgeGraph';

// Minimum section height, matching the space the section reserves so the layout doesn't jump;
// the component grows itself up to MAX_GRAPH_HEIGHT via autoHeight.
const GRAPH_HEIGHT = 280;
const MAX_GRAPH_HEIGHT = 560;

/**
 * A node as emitted by the exposed Mini Graph's `onNodeClick` (see `EntityGraphNode` in
 * asserts-app-plugin's `externalComponents/types.ts`). Declared locally, like the assertions
 * widget's props in `KnowledgeGraphInsights.tsx` — the SM app doesn't depend on asserts types.
 */
export interface ExposedMiniGraphNode {
  id: string;
  name: string;
  type: string;
  scope?: Record<string, string>;
  properties: Record<string, unknown>;
}

/** Props contract of the `grafana-asserts-app/mini-graph/v1` exposed component. */
export interface ExposedMiniGraphProps {
  cypherQuery: string;
  start: number | string;
  end: number | string;
  height: number | string;
  /** Container grows/shrinks to the laid-out graph within [min, max] px; `height` applies until measured. */
  autoHeight?: { min: number; max: number };
  /** Anchors the ranked layout on this entity (first rank + halo); matched by type + name + scope. */
  focusEntity?: { type: string; name: string; scope?: { env?: string; site?: string; namespace?: string } };
  nodeLimit?: number;
  nodeFilter?: (node: ExposedMiniGraphNode) => boolean;
  onNodeClick?: (node: ExposedMiniGraphNode) => void;
  /** dagre orientation; 'TB' puts the shallow neighbourhood's sibling fan on the horizontal axis. */
  rankdir?: 'LR' | 'TB';
}

export type ExposedMiniGraphComponent = React.ComponentType<ExposedMiniGraphProps>;

/**
 * Resolves the Knowledge Graph's exposed Mini Graph component. Null on stacks whose asserts
 * app predates the exposure — the Connected services section renders nothing there.
 */
export function useExposedMiniGraph() {
  return usePluginComponent<ExposedMiniGraphProps>(KG_ENTITY_GRAPH_COMPONENT_ID);
}

interface ConnectedServicesMiniGraphProps {
  check: Check;
  MiniGraph: ExposedMiniGraphComponent;
}

/**
 * The check's service neighbourhood rendered by the Knowledge Graph's exposed Mini Graph
 * component (the workbench minigraph style, with the check as the focus entity): the KG app owns
 * fetching, the ranked layout, insight rings (including the own-vs-connected split), the node
 * card (hover preview / click-pinned, with env + insights), and loading/error/empty states — so
 * the section stays visually consistent with the KG by construction. No `onNodeClick` deep link:
 * it would race the pinned card, and the section header already links the check into the
 * Knowledge Graph.
 */
export function ConnectedServicesMiniGraph({ check, MiniGraph }: ConnectedServicesMiniGraphProps) {
  const [timeRange] = useTimeRange();

  return (
    <div data-testid={CONNECTED_SERVICES_TEST_ID.exposedGraph}>
      <MiniGraph
        cypherQuery={buildServiceNeighbourhoodQuery(getSyntheticCheckEntityName(check))}
        start={timeRange.from.valueOf()}
        end={timeRange.to.valueOf()}
        height={GRAPH_HEIGHT}
        // Grow the section to the graph's natural size instead of zooming out to a fixed box.
        autoHeight={{ min: GRAPH_HEIGHT, max: MAX_GRAPH_HEIGHT }}
        // The check leads the graph: the Cypher anchors on the SyntheticCheck entity, and the
        // focus puts it in the first rank with a halo. Scope is omitted — the check's entity
        // name (job__target) is unique enough, and SM doesn't know the KG-side scope.
        focusEntity={{ type: KG_SYNTHETIC_CHECK_ENTITY_TYPE, name: getSyntheticCheckEntityName(check) }}
        // TB despite the wide section: the neighbourhood is shallow (check → service →
        // neighbours, ~3 ranks) but sibling-heavy, so top-to-bottom puts the sibling fan on the
        // horizontal axis. LR would stack the siblings vertically.
        rankdir="TB"
      />
    </div>
  );
}
