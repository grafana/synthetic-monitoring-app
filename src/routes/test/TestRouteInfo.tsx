import React from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import { DataTestIds } from '../../test/dataTestIds';

export function TestRouteInfo() {
  const location = useLocation();

  return (
    <div data-testid={DataTestIds.TEST_ROUTER_INFO} aria-hidden>
      <div data-testid={DataTestIds.TEST_ROUTER_INFO_PATHNAME}>{location.pathname}</div>
      <div data-testid={DataTestIds.TEST_ROUTER_INFO_SEARCH}>{location.search}</div>
    </div>
  );
}
