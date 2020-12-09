import { SMDataSource } from '../DataSource';
import { PluginType, PluginSignatureStatus, DataSourceInstanceSettings } from '@grafana/data';
import { SMOptions } from '../types';

export const instanceSettings: DataSourceInstanceSettings<SMOptions> = {
  id: 32,
  uid: 'testuid',
  type: 'synthetic-monitoring-datasource',
  name: 'Synthetic Monitoring',
  meta: {
    type: PluginType.datasource,
    name: 'Synthetic Monitoring API',
    id: 'synthetic-monitoring-datasource',
    info: {
      author: {
        name: 'Grafana',
        url: '',
      },
      description: 'Synthetic Monitoring API',
      links: [],
      logos: {
        small: 'public/plugins/synthetic-monitoring-datasource/img/logo.svg',
        large: 'public/plugins/synthetic-monitoring-datasource/img/logo.svg',
      },
      build: {},
      screenshots: [],
      version: '',
      updated: '',
    },
    dependencies: {
      grafanaVersion: '*',
      plugins: [],
    },
    includes: undefined,
    module: 'plugins/synthetic-monitoring-datasource/module',
    baseUrl: 'public/plugins/synthetic-monitoring-datasource',
    category: '',
    signature: PluginSignatureStatus.unsigned,
    annotations: false,
    metrics: true,
    alerting: false,
    logs: false,
    tracing: false,
    streaming: false,
  },
  jsonData: {
    apiHost: 'http://localhost:4030',
    dashboards: [
      {
        json: 'sm-http.json',
        latestVersion: 24,
        title: 'Synthetic Monitoring HTTP',
        uid: 'rq0JrllZz',
        version: 24,
      },
      {
        json: 'sm-ping.json',
        latestVersion: 23,
        title: 'Synthetic Monitoring Ping',
        uid: 'EHyn7ueZk',
        version: 23,
      },
      {
        json: 'sm-dns.json',
        latestVersion: 9,
        title: 'Synthetic Monitoring - DNS',
        uid: 'lgL6odgGz',
        version: 9,
      },
      {
        json: 'sm-tcp.json',
        latestVersion: 8,
        title: 'Synthetic Monitoring TCP',
        uid: 'mh84e5mMk',
        version: 8,
      },
      {
        json: 'sm-summary.json',
        latestVersion: 36,
        title: 'Synthetic Monitoring Summary',
        uid: 'fU-WBSqWz',
        version: 36,
      },
    ],
    logs: {
      grafanaName: 'Synthetic Monitoring Logs',
      hostedId: 5364,
    },
    metrics: {
      grafanaName: 'Synthetic Monitoring Metrics',
      hostedId: 12910,
    },
  },
};

export const getInstanceMock = (settings: DataSourceInstanceSettings<SMOptions> | undefined = instanceSettings) => {
  const instance = new SMDataSource(settings);
  instance.getMetricsDS = jest.fn().mockImplementation(() => ({ url: 'a url' }));
  instance.addCheck = jest.fn().mockImplementation(() => Promise.resolve({ id: 3 }));
  instance.listProbes = jest.fn().mockImplementation(() =>
    Promise.resolve([
      {
        name: 'tacos',
        id: 32,
        public: false,
        latitude: 0.0,
        longitude: 0.0,
        region: '',
        labels: [{ name: 'Mr', value: 'Orange' }],
        online: true,
        onlineChange: 0,
      },
      {
        name: 'burritos',
        id: 42,
        public: true,
        latitude: 0.0,
        longitude: 0.0,
        region: '',
        labels: [{ name: 'Mr', value: 'Pink' }],
        online: false,
        onlineChange: 0,
      },
    ])
  );
  instance.addProbe = jest.fn().mockImplementation(() => Promise.resolve({ token: 'a token' }));
  instance.deleteProbe = jest.fn();
  instance.updateProbe = jest.fn();
  instance.resetProbeToken = jest.fn();
  instance.listChecks = jest.fn().mockImplementation(() =>
    Promise.resolve([
      {
        job: 'a jobname',
        id: 1,
        target: 'example.com',
        frequency: 60000,
        timeout: 3000,
        enabled: true,
        labels: [],
        probes: [],
        settings: {
          ping: {
            ipVersion: 'V4',
            dontFragment: false,
          },
        },
      },
    ])
  );
  instance.deleteCheck = jest.fn();
  instance.updateCheck = jest.fn();
  return instance;
};
