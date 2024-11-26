import React from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import { DataTestIds } from '../dataTestIds';

/**
 * TestRouteInfo component.
 * Exposes the current pathname and search query string of the current location,
 * so that it can be used to verify paths/searches in tests.
 *
 * @important This component should only be used in tests.
 *
 * @example
 *   expect(screen.getByTestId(DataTestIds.TEST_ROUTER_INFO_PATHNAME)).toHaveTextContent(
 *     generateRoutePath(ROUTES.ViewProbe, { id: probe.id })
 *   );
 *
 * @constructor
 */
export function TestRouteInfo() {
  if (process.env.NODE_ENV !== 'test') {
    // This should only be used in tests
    return null;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const location = useLocation();

  return (
    <div data-testid={DataTestIds.TEST_ROUTER_INFO} aria-hidden>
      <div data-testid={DataTestIds.TEST_ROUTER_INFO_PATHNAME}>{location.pathname}</div>
      <div data-testid={DataTestIds.TEST_ROUTER_INFO_SEARCH}>{location.search}</div>
    </div>
  );
}
