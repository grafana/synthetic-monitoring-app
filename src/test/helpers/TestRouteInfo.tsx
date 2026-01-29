import React from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import { ROUTER_TEST_ID } from '../dataTestIds';

/**
 * TestRouteInfo component.
 * Exposes the current pathname and search query string of the current location,
 * so that it can be used to verify paths/searches in tests.
 *
 * @important This component should only be used in tests.
 *
 * @example
 *   expect(screen.getByTestId(ROUTER_TEST_ID.pathname)).toHaveTextContent(
 *     generateRoutePath(AppRoutes.ViewProbe, { id: probe.id })
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
    <div data-testid={ROUTER_TEST_ID.info} aria-hidden>
      <div data-testid={ROUTER_TEST_ID.pathname}>{location.pathname}</div>
      <div data-testid={ROUTER_TEST_ID.search}>{location.search}</div>
    </div>
  );
}
