import { AppRoutes } from 'routing/types';

/**
 * Every routable page pattern in the app, in a `matchRoutes`-compatible shape. Used to
 * resolve the current pathname to a low-cardinality `page` property on tracking events
 * (see `features/tracking/globalTrackingProps`).
 *
 * `AppRoutes` doesn't include the nested leaf routes declared inline in
 * `InitialisedRouter`, so those are listed explicitly here. When adding a page to the
 * router, add its pattern here if no existing pattern matches it.
 */
export const PAGE_ROUTE_PATTERNS: string[] = [
  ...Object.values(AppRoutes),
  'checks/new/:checkTypeGroup',
  'config/access-tokens',
  'config/terraform',
  'config/label-migration',
  'config/secrets',
];
