import React, { ReactNode } from 'react';
import { NavModelItem, OrgRole } from '@grafana/data';
import { BackendSrvRequest } from '@grafana/runtime';
import axios from 'axios';
import { from } from 'rxjs';
import { LOGS_DATASOURCE, METRICS_DATASOURCE, SM_DATASOURCE } from 'test/fixtures/datasources';
import { FULL_ADMIN_ACCESS } from 'test/fixtures/rbacPermissions';

import { SMDataSource } from 'datasource/DataSource';

import { CONFIG_TEST_ID } from '../../dataTestIds';

/**
 * @grafana/runtime mock for React Router v6.
 *
 * Provides a minimal history implementation compatible with React Router v6's
 * Router component. The test wrapper (render.tsx) resets the location before
 * each test for isolation.
 */
jest.mock('@grafana/runtime', () => {
  const actual = jest.requireActual('@grafana/runtime');

  const appEvents = {
    publish: jest.fn(),
    subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
    getStream: jest.fn(),
    removeAllListeners: jest.fn(),
    newScopedBus: jest.fn(),
  };

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
    const parsed = parsePath(path);
    // Prevent infinite loops by skipping navigation to the same location
    if (location.pathname === parsed.pathname && location.search === parsed.search) {
      return;
    }
    const next: Location = { ...parsed, state: null, key: Math.random().toString(36).slice(2) };
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

  /**
   * Mock of Grafana core's nested folder picker (bootstrapped via
   * setFolderPicker in a real Grafana instance, so unavailable in jsdom).
   * Mirrors the real behaviour closely enough for integration tests:
   * fetches the folder tree from the (MSW-mocked) folders API, applies
   * server-side permission filtering via the `permission` query param,
   * offers the root level as "Dashboards" when showRootFolder is set, and
   * reports selections through onChange(uid, title) where '' means root.
   */
  const NO_SELECTION = '__folder-picker-none__';

  function FolderPickerMock({
    value,
    onChange,
    showRootFolder,
    excludeUIDs,
    permission = 'edit',
  }: {
    value?: string;
    onChange?: (folderUID: string | undefined, folderName: string | undefined) => void;
    showRootFolder?: boolean;
    excludeUIDs?: string[];
    permission?: 'view' | 'edit';
  }) {
    const [options, setOptions] = React.useState<Array<{ uid: string; title: string }>>([]);

    React.useEffect(() => {
      let cancelled = false;

      const load = async () => {
        const result: Array<{ uid: string; title: string }> = [];
        // The tree structure comes from the unfiltered listing (like the real
        // picker, which browses through folders the user can only view), while
        // selectable options come from the server-side permission filter — so
        // editable folders nested under read-only parents are still offered.
        const list = (params: Record<string, string>) =>
          axios.request({ url: '/api/folders', method: 'GET', params }).then((res) => res.data);

        const walk = async (parentUid?: string) => {
          const baseParams: Record<string, string> = parentUid ? { parentUid } : {};
          const viewable = await list(baseParams);
          const selectable = permission === 'view' ? viewable : await list({ ...baseParams, permission: 'Edit' });
          const selectableUids = new Set<string>(selectable.map((f: { uid: string }) => f.uid));

          for (const folder of viewable) {
            if (selectableUids.has(folder.uid)) {
              result.push({ uid: folder.uid, title: folder.title });
            }
            await walk(folder.uid);
          }
        };

        await walk(undefined);
        if (!cancelled) {
          setOptions(result);
        }
      };

      load().catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [permission]);

    const visibleOptions = options.filter((o) => !excludeUIDs?.includes(o.uid));
    const selectValue = value === undefined || value === null ? NO_SELECTION : value;
    const hasValueOption =
      selectValue === NO_SELECTION || selectValue === '' || visibleOptions.some((o) => o.uid === selectValue);

    return (
      <select
        aria-label="Folder picker"
        value={selectValue}
        onChange={(e) => {
          const uid = e.target.value;
          if (uid === NO_SELECTION) {
            onChange?.(undefined, undefined);
            return;
          }
          if (uid === '') {
            onChange?.('', 'Dashboards');
            return;
          }
          onChange?.(uid, visibleOptions.find((o) => o.uid === uid)?.title);
        }}
      >
        <option value={NO_SELECTION}>Select folder</option>
        {showRootFolder && <option value="">Dashboards</option>}
        {visibleOptions.map((o) => (
          <option key={o.uid} value={o.uid}>
            {o.title}
          </option>
        ))}
        {!hasValueOption && <option value={selectValue}>{selectValue}</option>}
      </select>
    );
  }

  return {
    ...actual,
    locationService,
    FolderPicker: FolderPickerMock,
    LocationServiceProvider: actual.LocationServiceProvider,
    // Defaults to "not installed"; tests can override via (useAppPluginInstalled as jest.Mock).mockReturnValue(...)
    useAppPluginInstalled: jest.fn(() => ({ loading: false, error: undefined, value: false })),
    // Defaults to "no exposed component"; tests can override via (usePluginComponent as jest.Mock).mockReturnValue(...)
    usePluginComponent: jest.fn(() => ({ component: null, isLoading: false })),
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
      post: (url: string, data?: unknown) =>
        axios.request({ url, method: `POST`, data }).then((response) => response.data),
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
    getAppEvents: () => appEvents,
    PluginPage: ({ actions, children, pageNav }: { actions: any; children: ReactNode; pageNav: NavModelItem }) => (
      <div>
        <h2>{pageNav?.text}</h2>
        <div>{actions}</div>
        {children}
        <div data-testid={CONFIG_TEST_ID.layout.activeTab}>
          {pageNav?.children?.find((c) => c.active)?.text ?? 'No active tab'}
        </div>
      </div>
    ),
  };
});
