import { DataFrame, IconName } from '@grafana/data';
import { CustomTransformOperator } from '@grafana/scenes';
import { map } from 'rxjs';

import { CheckType } from 'types';
import { getCheckTypeGroup } from 'utils';
import { CHECK_TYPE_GROUP_OPTIONS } from 'hooks/useCheckTypeGroupOptions';

import { KG_PLUGIN_ID, KG_SERVICE_ENTITY_TYPE, KG_SYNTHETIC_CHECK_ENTITY_TYPE } from './knowledgeGraph';

const NODES_FRAME = 'nodes';
const EDGES_FRAME = 'edges';
const SUBTITLE_FIELD = 'subtitle';
const ICON_FIELD = 'icon';
// The KG datasource sets mainstat to 0 on every node and edge, which the panel renders as a "0.00"
// label. It carries no meaning here, so we drop it to declutter the graph.
const MAIN_STAT_FIELD = 'mainstat';

/**
 * Icon for the originating check node. Reuses the icon the app already shows for the check's type
 * group on the "choose a check type" cards (`CHECK_TYPE_GROUP_OPTIONS`), so the graph stays visually
 * consistent with check creation. Falls back to the API Endpoint icon for anything unmapped.
 */
export function getCheckNodeIcon(checkType: CheckType): IconName {
  const group = getCheckTypeGroup(checkType);
  return CHECK_TYPE_GROUP_OPTIONS.find((option) => option.value === group)?.icon ?? 'heart-rate';
}

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
 * Starting from the SyntheticCheck entity, it walks the MONITORS relationship to the linked
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
    `MATCH (sy:SyntheticCheck {name: "${escapeCypher(checkEntityName)}"})-[:MONITORS]->(s1:Service)`,
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
 * Tidies the node graph frames for display:
 * - the originating SyntheticCheck node gets a check-type-specific icon so it's easy to spot which
 *   entity the user came from;
 * - the meaningless zero-valued `mainstat` label is stripped from both nodes and edges.
 *
 * Any other frame passes through unchanged; values are copied rather than mutated to keep it pure.
 */
export function applyGraphPresentation(frames: DataFrame[], icon: IconName): DataFrame[] {
  return frames.map((frame) => {
    if (frame.name === EDGES_FRAME) {
      return { ...frame, fields: frame.fields.filter((field) => field.name !== MAIN_STAT_FIELD) };
    }

    if (frame.name !== NODES_FRAME) {
      return frame;
    }

    const subtitleField = frame.fields.find((field) => field.name === SUBTITLE_FIELD);
    if (!subtitleField) {
      return frame;
    }

    const isCheckNode = (index: number) => subtitleField.values[index] === KG_SYNTHETIC_CHECK_ENTITY_TYPE;

    const fields = frame.fields
      .filter((field) => field.name !== MAIN_STAT_FIELD)
      .map((field) => {
        if (field.name === ICON_FIELD) {
          return { ...field, values: field.values.map((value, index) => (isCheckNode(index) ? icon : value)) };
        }
        return field;
      });

    return { ...frame, fields };
  });
}

/**
 * Scenes transform wrapper around {@link applyGraphPresentation} for use with `useDataTransformer`,
 * bound to the icon for the current check type.
 */
export const graphPresentationTransformation =
  (icon: IconName): CustomTransformOperator =>
  () =>
  (source) =>
    source.pipe(map((frames) => applyGraphPresentation(frames, icon)));
