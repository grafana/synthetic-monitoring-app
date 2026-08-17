import {
  type InstanceMatchResult,
  type Label,
  type LabelMatcher,
  matchInstancesToRouteTrees,
  type RouteMatch,
  type RouteWithID,
  USER_DEFINED_TREE_NAME,
} from '@grafana/alerting';
import { Factory } from 'fishery';

// The RoutingTree type isn't exported directly from @grafana/alerting, so we
// derive it from the function that consumes a list of trees.
type RoutingTree = Parameters<typeof matchInstancesToRouteTrees>[0][number];
type MatchingJourneyItem = RouteMatch['matchDetails']['matchingJourney'][number];

// The `Route` / `RouteWithID` types come from @grafana/alerting via type-fest's
// `OverrideProperties`, which doesn't fully resolve in this project. As a result
// those types collapse to `{ id; routes }` and don't expose the runtime fields
// (`continue`, `matchers`, `receiver`, ...) the routing preview reads. We model
// the runtime shape here and perform the single necessary cast inside
// `buildRouteWithId`, so call sites stay fully typed and cast-free.
interface RouteInput {
  id?: string;
  continue?: boolean;
  receiver?: string;
  matchers?: LabelMatcher[];
  routes?: RouteInput[];
}

let routeIdSequence = 1;

/**
 * Builds a route node for a routing tree, filling in the boilerplate the type
 * requires. Only the fields relevant to a test need to be passed.
 */
export const buildRouteWithId = (overrides: RouteInput = {}): RouteWithID => {
  const route: RouteInput = {
    id: `route-${routeIdSequence++}`,
    continue: false,
    matchers: [],
    routes: [],
    ...overrides,
  };

  return route as unknown as RouteWithID;
};

export const matchingJourneyItemFactory = Factory.define<MatchingJourneyItem>(() => ({
  route: buildRouteWithId(),
  matchDetails: [],
  matched: true,
}));

interface RouteMatchTransientParams {
  treeName: string;
  matchingJourney: MatchingJourneyItem[];
}

/**
 * Builds a fully-typed RouteMatch. Pass `treeName` and `matchingJourney` as
 * transient params to describe the tree a match belongs to and the routes that
 * were traversed; the effective (delivering) route defaults to the last item in
 * the journey.
 */
export const routeMatchFactory = Factory.define<RouteMatch, RouteMatchTransientParams>(({ transientParams }) => {
  const { treeName = USER_DEFINED_TREE_NAME, matchingJourney = [matchingJourneyItemFactory.build()] } = transientParams;
  const effectiveRoute = matchingJourney[matchingJourney.length - 1]?.route ?? buildRouteWithId();

  return {
    route: effectiveRoute,
    routeTree: {
      metadata: { name: treeName },
      expandedSpec: matchingJourney[0]?.route ?? buildRouteWithId(),
    },
    matchDetails: {
      route: effectiveRoute,
      labels: [] as Label[],
      matchingJourney,
    },
  };
});

/**
 * Builds a fully-typed RoutingTree. Tests generally only care about
 * `metadata.name` and `spec.defaults.receiver`; this factory fills in the rest
 * of the boilerplate the type requires so callers don't have to cast.
 */
export const routingTreeFactory = Factory.define<RoutingTree>(({ sequence }) => ({
  apiVersion: 'notifications.alerting.grafana.app/v1beta1',
  kind: 'RoutingTree',
  metadata: { name: `routing-tree-${sequence}` },
  spec: {
    defaults: { receiver: 'grafana-default-email' },
    routes: [],
  },
}));

export const instanceMatchResultFactory = Factory.define<InstanceMatchResult>(() => ({
  labels: [],
  matchedRoutes: [],
}));
