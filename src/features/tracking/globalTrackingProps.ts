import { matchRoutes } from 'react-router';
import { locationService } from '@grafana/runtime';
import type { TrackingEventProps } from 'features/tracking/utils';

import { PLUGIN_URL_PATH } from 'routing/constants';
import { PAGE_ROUTE_PATTERNS } from 'routing/pagePatterns';
import { queryClient } from 'data/queryClient';

// the plugin base without its trailing slash, so the bare plugin root is recognised too
const PLUGIN_BASE_PATH = PLUGIN_URL_PATH.replace(/\/$/, '');

const routeObjects = PAGE_ROUTE_PATTERNS.map((path) => ({ path }));

/**
 * Context properties automatically attached to every tracking event (see
 * `createEventFactory`). Resolved lazily at the moment an event fires so values are
 * always current without needing navigation listeners. Each resolver is guarded
 * individually: enrichment must never break the interaction being tracked, and one
 * failing resolver shouldn't take the others down with it.
 */
export function getGlobalTrackingProps(): TrackingEventProps {
  return {
    ...guard(getPageProps),
    ...guard(getCheckCountProps),
  };
}

function guard(resolve: () => TrackingEventProps): TrackingEventProps {
  try {
    return resolve();
  } catch {
    return {};
  }
}

/**
 * Reports the current page as a route pattern (e.g. `checks/:id/edit`) rather than the
 * raw pathname so the property stays low-cardinality. `matchRoutes` ranks candidates,
 * so static patterns (`checks/choose-type`) win over dynamic ones (`checks/:id`).
 * Pages that don't resolve to a known pattern (e.g. external components rendered
 * outside the plugin's own pages) report their pathname as-is.
 */
function getPageProps(): TrackingEventProps {
  const { pathname } = locationService.getLocation();

  if (pathname !== PLUGIN_BASE_PATH && !pathname.startsWith(PLUGIN_URL_PATH)) {
    return { page: pathname };
  }

  const appPathname = pathname.slice(PLUGIN_BASE_PATH.length) || '/';
  const match = matchRoutes(routeObjects, appPathname)?.at(-1);

  return { page: match?.route.path ?? appPathname };
}

function getCheckCountProps(): TrackingEventProps {
  // The literal ['checks'] prefix must stay in sync with QUERY_KEYS.list in
  // data/useChecks. It can't be imported from there because data/useChecks imports
  // tracking event files, which would create an import cycle back into this module.
  // getQueriesData is a passive cache read and never triggers a fetch, so the count is
  // omitted until some page has loaded the check list.
  const cachedChecksLists = queryClient.getQueriesData({ queryKey: ['checks'] });
  const checks = cachedChecksLists.map(([_, data]) => data).find(Array.isArray);

  return { check_count: checks?.length };
}
