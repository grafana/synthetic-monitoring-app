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
 * Reports the current page as a low-cardinality route pattern (e.g. `checks/:id/edit`).
 * `matchRoutes` ranks candidates, so static patterns win over dynamic ones. Unmatched
 * pages (e.g. external components outside the plugin) report their pathname as-is.
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
  // data/useChecks — it can't be imported from there without creating an import cycle
  // (data/useChecks imports tracking event files). getQueriesData never triggers a fetch.
  const cachedChecksLists = queryClient.getQueriesData({ queryKey: ['checks'] });
  const checks = cachedChecksLists.map(([_, data]) => data).find(Array.isArray);

  return { check_count: checks?.length };
}
