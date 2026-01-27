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
 *   expect(screen.getByTestId(DataTestIds.TestRouterInfoPathname)).toHaveTextContent(
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
    <div data-testid={DataTestIds.TestRouterInfo} aria-hidden>
      <div data-testid={DataTestIds.TestRouterInfoPathname}>{location.pathname}</div>
      <div data-testid={DataTestIds.TestRouterInfoSearch}>{location.search}</div>
    </div>
  );
}
