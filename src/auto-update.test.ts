import { autoUpdate } from 'auto-update';
import * as runtime from '@grafana/runtime';
import * as initUtils from 'initialization-utils';
import * as loader from 'dashboards/loader';
import * as appEvents from 'grafana/app/core/app_events';

// Module mocks
jest.unmock('@grafana/data');
jest.mock('grafana/app/core/app_events', () => ({
  emit: jest.fn(),
}));
jest.mock('@grafana/runtime', () => {
  const actual = jest.requireActual('@grafana/runtime');
  return {
    __esModule: true,
    ...actual,
    config: {
      datasources: {},
    },
  };
});
jest.mock('utils', () => {
  const rest = jest.requireActual('utils');
  return {
    __esModule: true,
    ...rest,
    getPluginSettings: jest.fn(() => {
      return {
        apiHost: 'sm_api.com',
        logs: {
          grafanaName: 'logs name',
        },
        metrics: {
          grafanaName: 'metrics name',
        },
      };
    }),
  };
});
jest.mock('initialization-utils', () => {
  const actual = jest.requireActual('initialization-utils');
  return {
    __esModule: true,
    ...actual,
    updateSMDatasource: jest.fn(),
  };
});
jest.mock('dashboards/loader', () => {
  const actual = jest.requireActual('dashboards/loader');
  return {
    __esModule: true,
    ...actual,
    listAppDashboards: jest.fn(() => Promise.resolve([{ title: 'a dashie', uid: 'dashie uid', version: 1 }])),
    importAllDashboards: jest.fn(),
  };
});

beforeEach(() => {
  //@ts-ignore
  loader.importAllDashboards.mockReset();
  //@ts-ignore
  initUtils.updateSMDatasource.mockReset();
  //@ts-ignore
  appEvents.emit.mockReset();
});

it('skips updates if none is required', () => {
  autoUpdate();
  expect(loader.importAllDashboards).not.toHaveBeenCalled();
  expect(initUtils.updateSMDatasource).not.toHaveBeenCalled();
  expect(appEvents.emit).not.toHaveBeenCalled();
});

it('updates datasource', async () => {
  runtime.config.datasources = {
    //@ts-ignore
    'Synthetic Monitoring': {
      type: 'synthetic-monitoring-datasource',
      name: 'a totally rad datasource',
      jsonData: {},
    },
  };
  await autoUpdate();
  expect(initUtils.updateSMDatasource).toHaveBeenCalledWith('a totally rad datasource', {
    apiHost: 'sm_api.com',
    logs: {
      grafanaName: 'logs name',
    },
    metrics: {
      grafanaName: 'metrics name',
    },
  });
  expect(loader.importAllDashboards).not.toHaveBeenCalled();
  expect(appEvents.emit).not.toHaveBeenCalled();
});

it('updates dashboards', async () => {
  runtime.config.datasources = {
    //@ts-ignore
    'Synthetic Monitoring': {
      type: 'synthetic-monitoring-datasource',
      name: 'a totally rad datasource',
      jsonData: {
        //@ts-ignore
        apiHost: 'sm_api.com',
        logs: {
          grafanaName: 'logs name',
        },
        metrics: {
          grafanaName: 'metrics name',
        },
        //@ts-ignore
        dashboards: [
          {
            json: 'sm-summary.json',
            latestVersion: 41,
            title: 'Synthetic Monitoring Summary',
            uid: 'fU-WBSqWz',
            version: 41,
          },
          {
            json: 'sm-http.json',
            latestVersion: 31,
            title: 'Synthetic Monitoring HTTP',
            uid: 'rq0JrllZz',
            version: 31,
          },
          {
            json: 'sm-ping.json',
            latestVersion: 29,
            title: 'Synthetic Monitoring Ping',
            uid: 'EHyn7ueZk',
            version: 29,
          },
          {
            json: 'sm-dns.json',
            latestVersion: 18,
            title: 'Synthetic Monitoring DNS',
            uid: 'lgL6odgGz',
            version: 18,
          },
          {
            json: 'sm-tcp.json',
            latestVersion: 20,
            title: 'Synthetic Monitoring TCP',
            uid: 'mh84e5mMk',
            version: 20,
          },
          {
            json: 'sm-traceroute.json',
            latestVersion: 6,
            title: 'Synthetic Monitoring Traceroute',
            uid: 'hk8gHB4nk',
            version: 6,
          },
        ],
      },
    },
  };
  //@ts-ignore
  loader.listAppDashboards = jest.fn(() =>
    Promise.resolve([
      {
        json: 'sm-summary.json',
        latestVersion: 42,
        title: 'Synthetic Monitoring Summary',
        uid: 'fU-WBSqWz',
        version: 42,
      },
      {
        json: 'sm-http.json',
        latestVersion: 32,
        title: 'Synthetic Monitoring HTTP',
        uid: 'rq0JrllZz',
        version: 32,
      },
      {
        json: 'sm-ping.json',
        latestVersion: 30,
        title: 'Synthetic Monitoring Ping',
        uid: 'EHyn7ueZk',
        version: 30,
      },
      {
        json: 'sm-dns.json',
        latestVersion: 19,
        title: 'Synthetic Monitoring DNS',
        uid: 'lgL6odgGz',
        version: 19,
      },
      {
        json: 'sm-tcp.json',
        latestVersion: 21,
        title: 'Synthetic Monitoring TCP',
        uid: 'mh84e5mMk',
        version: 21,
      },
      {
        json: 'sm-traceroute.json',
        latestVersion: 7,
        title: 'Synthetic Monitoring Traceroute',
        uid: 'hk8gHB4nk',
        version: 7,
      },
    ])
  );
  await autoUpdate();

  expect(initUtils.updateSMDatasource).not.toHaveBeenCalled();
  expect(loader.importAllDashboards).toHaveBeenCalledWith('metrics name', 'logs name', 'a totally rad datasource');
  expect(appEvents.emit).toHaveBeenCalledWith({ name: 'alert-success' }, ['Synthetic Monitoring dashboards updated']);
});
