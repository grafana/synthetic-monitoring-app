import React, { ReactNode } from 'react';
import { NavModelItem, OrgRole } from '@grafana/data';
import { BackendSrvRequest } from '@grafana/runtime';
import axios from 'axios';
import { from } from 'rxjs';
import { LOGS_DATASOURCE, METRICS_DATASOURCE, SM_DATASOURCE } from 'test/fixtures/datasources';
import { FULL_ADMIN_ACCESS } from 'test/fixtures/rbacPermissions';

import { SMDataSource } from 'datasource/DataSource';

import { DataTestIds } from '../../dataTestIds';

/**
 * @grafana/runtime mock for React Router v6.
 *
 * Provides a minimal history implementation compatible with React Router v6's
 * Router component. The test wrapper (render.tsx) resets the location before
 * each test for isolation.
 */
jest.mock('@grafana/runtime', () => {
  const actual = jest.requireActual('@grafana/runtime');

  type Location = { pathname: string; search: string; hash: string; state: unknown; key: string };
  type PathArg = string | { pathname?: string; search?: string; hash?: string };

  let location: Location = { pathname: '/', search: '', hash: '', state: null, key: 'default' };
  let listeners: Array<(update: { location: Location; action: string }) => void> = [];
  let blockers: Array<(location: Location, action: string) => boolean | void> = [];

  const parsePath = (path: PathArg) => {
    if (typeof path !== 'string') {
      return { pathname: path.pathname || '/', search: path.search || '', hash: path.hash || '' };
    }
    const searchIdx = path.indexOf('?');
    const hashIdx = path.indexOf('#');
    return {
      pathname: searchIdx >= 0 ? path.slice(0, searchIdx) : hashIdx >= 0 ? path.slice(0, hashIdx) : path,
      search: searchIdx >= 0 ? path.slice(searchIdx, hashIdx >= 0 ? hashIdx : undefined) : '',
      hash: hashIdx >= 0 ? path.slice(hashIdx) : '',
    };
  };

  const navigate = (path: PathArg, action: string) => {
    const next: Location = { ...parsePath(path), state: null, key: Math.random().toString(36).slice(2) };
    for (const blocker of blockers) {
      if (blocker(next, action) === false) {
        return;
      }
    }
    location = next;
    listeners.forEach((l) => l({ location, action }));
  };

  const history = {
    get length() {
      return 1;
    },
    get location() {
      return location;
    },
    get action() {
      return 'POP' as const;
    },
    push: (path: PathArg) => navigate(path, 'PUSH'),
    replace: (path: PathArg) => navigate(path, 'REPLACE'),
    go: () => {},
    back: () => {},
    forward: () => {},
    createHref: (to: PathArg) => (typeof to === 'string' ? to : to.pathname || '/'),
    block: (fn: (location: Location, action: string) => boolean | void) => {
      blockers.push(fn);
      return () => {
        blockers = blockers.filter((b) => b !== fn);
      };
    },
    listen: (fn: (update: { location: Location; action: string }) => void) => {
      listeners.push(fn);
      return () => {
        listeners = listeners.filter((l) => l !== fn);
      };
    },
  };

  const locationService = {
    push: jest.fn((path: PathArg) => history.push(path)),
    replace: jest.fn((path: PathArg) => history.replace(path)),
    getLocation: jest.fn(() => location),
    getHistory: jest.fn(() => history),
    getSearch: jest.fn(() => new URLSearchParams(location.search)),
    getSearchObject: jest.fn(() => Object.fromEntries(new URLSearchParams(location.search))),
    partial: jest.fn((query: Record<string, string | undefined>, replace?: boolean) => {
      const params = new URLSearchParams(location.search);
      Object.entries(query).forEach(([k, v]) => (v == null ? params.delete(k) : params.set(k, v)));
      const search = params.toString();
      const href = search ? `${location.pathname}?${search}` : location.pathname;
      replace ? history.replace(href) : history.push(href);
    }),
  };

  return {
    ...actual,
    locationService,
    LocationServiceProvider: actual.LocationServiceProvider,
    config: {
      ...actual.config,
      datasources: {
        [METRICS_DATASOURCE.name]: METRICS_DATASOURCE,
        [LOGS_DATASOURCE.name]: LOGS_DATASOURCE,
      },
      featureToggles: { ...actual.config.featureToggles },
      bootData: {
        user: { ...actual.config.user, orgRole: OrgRole.Admin, permissions: FULL_ADMIN_ACCESS },
      },
    },
    getBackendSrv: () => ({
      datasourceRequest: axios.request,
      fetch: (request: BackendSrvRequest) =>
        from(
          axios.request({ ...request, method: request.method }).catch((e) => {
            const error = new Error(e.message);
            // @ts-expect-error Match error format with backendsrv
            error.data = e.response.data;
            // @ts-expect-error Match error format with backendsrv
            error.status = e.response.status;
            throw error;
          })
        ),
    }),
    getDataSourceSrv: () => ({
      getList: () => [METRICS_DATASOURCE, LOGS_DATASOURCE, SM_DATASOURCE],
      get: () => Promise.resolve(new SMDataSource(SM_DATASOURCE)),
    }),
    getLocationSrv: () => ({ update: (args: any) => args }),
    PluginPage: ({ actions, children, pageNav }: { actions: any; children: ReactNode; pageNav: NavModelItem }) => (
      <div>
        <h2>{pageNav?.text}</h2>
        <div>{actions}</div>
        {children}
        <div data-testid={DataTestIds.ConfigPageLayoutActiveTab}>
          {pageNav?.children?.find((c) => c.active)?.text ?? 'No active tab'}
        </div>
      </div>
    ),
  };
});
