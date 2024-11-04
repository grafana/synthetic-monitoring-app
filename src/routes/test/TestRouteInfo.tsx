import React from 'react';
import { useLocation, useParams } from 'react-router-dom-v5-compat';

import { DataTestIds } from '../../test/dataTestIds';

export function TestRouteInfo({ path, route }: { path?: string; route?: string }) {
  const location = useLocation();

  const params = useParams();
  return (
    <div data-testid={DataTestIds.TEST_ROUTER_INFO} aria-hidden>
      {route && <div>{route}</div>}
      {params && <div>{JSON.stringify(params)}</div>}
      <div data-testid="test-current-path">{path}</div>
      <div data-testid={DataTestIds.TEST_ROUTER_INFO_PATHNAME}>{location.pathname}</div>
      <div data-testid={DataTestIds.TEST_ROUTER_INFO_SEARCH}>{location.search}</div>
    </div>
  );
}
