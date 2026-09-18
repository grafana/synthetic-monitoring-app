import { useQuery } from '@tanstack/react-query';
import { getBackendSrv } from '@grafana/runtime';
import { useTimeRange } from '@grafana/scenes-react';
import { firstValueFrom } from 'rxjs';

import { useKGDS } from 'hooks/useKGDS';
import { STANDARD_REFRESH_INTERVAL } from 'components/constants';

import { NeighbourhoodNode, RingSeverity, ServiceNeighbourhood } from './ConnectedServices.utils';
import { KG_SERVICE_ENTITY_TYPE } from './knowledgeGraph';

export interface AssertionTimeline {
  assertionName?: string;
  alertName?: string;
  labels?: Record<string, string>;
  nestedTimelines?: AssertionTimeline[];
}

export interface EntityAssertionTimelines {
  type: string;
  name: string;
  scope?: Record<string, string>;
  allAssertions?: AssertionTimeline[];
}

/** One of a node's insights, attributed: the service's own, or propagated from check(s). */
export interface ClassifiedInsight {
  name: string;
  severity: RingSeverity;
  /** Names of the checks this insight propagated from; empty for the service's own insights. */
  sources: string[];
}

/**
 * A service node's insights split the way the KG splits them: `own` mirrors the KG's `assertion`
 * (rendered on the outer ring), `connected` mirrors `connectedAssertion` (inner ring) — insights
 * that back-propagated from a Synthetic Check over the MONITORED_BY relation.
 */
export interface NodeInsightClassification {
  own: ClassifiedInsight[];
  connected: ClassifiedInsight[];
}

function visitLeaves(timelines: AssertionTimeline[], visit: (leaf: AssertionTimeline) => void): void {
  for (const timeline of timelines) {
    if (timeline.nestedTimelines?.length) {
      visitLeaves(timeline.nestedTimelines, visit);
    } else {
      visit(timeline);
    }
  }
}

/** Graph insight names may include a context prefix, e.g. check_failures::AlertName. */
function matchesInsight(leaf: AssertionTimeline, insightName: string): boolean {
  return leaf.assertionName === insightName || leaf.alertName === insightName.split('::').at(-1);
}

/** Verified check provenance: explicit cross-scope labels, never a coincidentally matching name. */
function isCheckPropagated(leaf: AssertionTimeline): boolean {
  const labels = leaf.labels ?? {};
  const source = labels.asserts_source_entity_name;
  return Boolean(
    Object.keys(labels).some((key) => key.startsWith('asserts_origin_')) &&
      labels.asserts_source_entity_type === 'SyntheticCheck' &&
      source &&
      // Aggregated label arrays do not preserve source-name/type/scope pairings.
      !source.startsWith('[')
  );
}

/** Use explicit cross-scope provenance, never a coincidentally matching check name. */
export function getPropagatedCheckSources(timelines: AssertionTimeline[], insightName: string): string[] {
  const sources = new Set<string>();
  visitLeaves(timelines, (leaf) => {
    if (matchesInsight(leaf, insightName) && isCheckPropagated(leaf)) {
      sources.add(leaf.labels!.asserts_source_entity_name);
    }
  });
  return [...sources].sort();
}

const SEVERITY_RANK: Partial<Record<string, number>> = { critical: 3, warning: 2, info: 1 };

/** Rank for comparison; 0 for absent or unrecognized severities. */
function severityRank(severity: string | undefined): number {
  return (severity && SEVERITY_RANK[severity]) || 0;
}

/** Highest per-insight severity from the matching timelines, undefined when none carries one. */
function findInsightSeverity(timelines: AssertionTimeline[], insightName: string): RingSeverity | undefined {
  let best: RingSeverity | undefined;
  visitLeaves(timelines, (leaf) => {
    const severity = leaf.labels?.asserts_severity;
    if (!matchesInsight(leaf, insightName) || severityRank(severity) === 0) {
      return;
    }
    if (severityRank(severity) > severityRank(best)) {
      best = severity as RingSeverity;
    }
  });
  return best;
}

/** Assertion timelines for exactly this node's identity, even if a backend returns extra entities. */
function timelinesForNode(entities: EntityAssertionTimelines[], node: NeighbourhoodNode): AssertionTimeline[] {
  return entities
    .filter(
      (entity) =>
        entity.type === node.entityType &&
        entity.name === node.name &&
        (['env', 'site', 'namespace'] as const).every((key) => (entity.scope?.[key] ?? '') === (node.scope[key] ?? ''))
    )
    .flatMap((entity) => entity.allAssertions ?? []);
}

/**
 * Splits a node's insights into own vs connected using the assertion timelines.
 *
 * The frame's `insightNames` cannot be the sole source: depending on the KG version it lists the
 * entity's own assertions only, so a check-propagated insight may exist solely in the timelines
 * (it does live on the entity's `connectedAssertion`). Connected insights are therefore derived
 * from the timelines' provenance leaves directly; frame names that match one classify as
 * connected, the rest — including names the timelines don't cover — stay `own`, so missing data
 * degrades to the frame's mixed view rather than hiding anything. Severity comes from the
 * timeline labels, falling back to the node's overall ring severity (all the frame itself
 * carries).
 */
export function classifyNodeInsights(
  entities: EntityAssertionTimelines[],
  node: NeighbourhoodNode
): NodeInsightClassification {
  const timelines = timelinesForNode(entities, node);
  const fallbackSeverity = node.ringSegments[0]?.severity ?? 'healthy';

  const own: ClassifiedInsight[] = [];
  const connected: ClassifiedInsight[] = [];
  for (const name of node.insightNames) {
    const sources = getPropagatedCheckSources(timelines, name);
    const severity = findInsightSeverity(timelines, name) ?? fallbackSeverity;
    (sources.length > 0 ? connected : own).push({ name, severity, sources });
  }

  // Provenance leaves the frame didn't name still render as connected insights. Timelines cover
  // the dashboard window, so this reads as "propagated within the window" (matching the KG
  // workbench's range-scoped view), not "currently firing".
  visitLeaves(timelines, (leaf) => {
    const name = leaf.assertionName ?? leaf.alertName;
    if (!name || !isCheckPropagated(leaf)) {
      return;
    }
    if (node.insightNames.some((frameName) => matchesInsight(leaf, frameName))) {
      return;
    }
    if (connected.some((insight) => insight.name === name)) {
      return;
    }
    connected.push({
      name,
      severity: findInsightSeverity(timelines, name) ?? fallbackSeverity,
      sources: getPropagatedCheckSources(timelines, name),
    });
  });

  return { own, connected };
}

/**
 * Fetches assertion timelines for every service node, batched into one request. Runs when the
 * graph renders (not lazily on card open): the own/connected split drives the nodes' rings, not
 * just the popup card. Every service is included — not just the ones whose frame carries insight
 * names — because a check-propagated insight can exist without any own insight on the frame.
 * The rings and card degrade to the frame's mixed view while loading or on error.
 */
export function useNeighbourhoodInsightOrigins(neighbourhood: ServiceNeighbourhood) {
  const datasource = useKGDS();
  const [range] = useTimeRange();

  const entityKeys = neighbourhood.nodes
    .filter((node) => node.entityType === KG_SERVICE_ENTITY_TYPE)
    .map((node) => ({
      type: node.entityType,
      name: node.name,
      scope: Object.fromEntries(Object.entries(node.scope).filter(([, value]) => value !== '')),
    }));

  return useQuery({
    queryKey: ['kg-neighbourhood-insight-origins', datasource?.uid, entityKeys, range.from.valueOf(), range.to.valueOf()],
    enabled: entityKeys.length > 0 && Boolean(datasource),
    staleTime: 30_000,
    // Keep pace with the neighbourhood query so the split doesn't classify a fresh frame
    // against stale timelines.
    refetchInterval: STANDARD_REFRESH_INTERVAL,
    retry: false,
    queryFn: async () => {
      const response = await firstValueFrom(
        getBackendSrv().fetch<EntityAssertionTimelines[]>({
          url: `/api/datasources/uid/${encodeURIComponent(datasource!.uid)}/resources/api-server/v1/assertions`,
          method: 'POST',
          showErrorAlert: false,
          showSuccessAlert: false,
          data: {
            startTime: range.from.valueOf(),
            endTime: range.to.valueOf(),
            entityKeys,
            includeConnectedAssertions: true,
          },
        })
      );
      return response.data;
    },
  });
}
