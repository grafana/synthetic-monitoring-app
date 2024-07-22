import { DataSourceInstanceSettings, PluginSignatureStatus, PluginType } from '@grafana/data';

import { SMOptions } from 'datasource/types';

export const MetricsDSSettings: DataSourceInstanceSettings<any> = {
  id: 4,
  uid: 'grafanacloud-prom',
  type: 'prometheus',
  name: 'grafanacloud-ckbedwellksix-prom',
  meta: {
    id: 'prometheus',
    type: PluginType.datasource,
    name: 'Prometheus',
    info: {
      author: {
        name: 'Grafana Labs',
        url: 'https://grafana.com',
      },
      description: 'Open source time series database & alerting',
      links: [
        {
          name: 'Learn more',
          url: 'https://prometheus.io/',
        },
      ],
      logos: {
        small: 'public/app/plugins/datasource/prometheus/img/prometheus_logo.svg',
        large: 'public/app/plugins/datasource/prometheus/img/prometheus_logo.svg',
      },
      build: {},
      screenshots: [],
      version: '',
      updated: '',
    },
    dependencies: {
      grafanaDependency: '',
      grafanaVersion: '*',
      plugins: [],
    },
    includes: [],
    category: 'tsdb',
    backend: true,
    annotations: true,
    metrics: true,
    alerting: true,
    logs: false,
    tracing: false,
    queryOptions: {
      minInterval: true,
    },
    streaming: false,
    signature: PluginSignatureStatus.valid,
    module: 'core:plugin/prometheus',
    baseUrl: 'public/app/plugins/datasource/prometheus',
    angular: {
      detected: false,
      hideDeprecation: false,
    },
  },
  url: '/api/datasources/proxy/uid/grafanacloud-prom',
  isDefault: true,
  access: 'proxy',
  jsonData: {
    directUrl: 'https://prometheus-dev-01-dev-us-central-0.grafana-dev.net/api/prom',
    exemplarTraceIdDestinations: [
      {
        datasourceUid: 'grafanacloud-traces',
        name: 'traceID',
      },
    ],
    prometheusType: 'Mimir',
    prometheusVersion: '2.3.0',
    timeInterval: '60s',
    timeout: '150',
  },
  readOnly: true,
  cachingConfig: {
    enabled: false,
    TTLMs: 0,
  },
};

export const LogsDSSettings: DataSourceInstanceSettings<any> = {
  id: 8,
  uid: 'grafanacloud-logs',
  type: 'loki',
  name: 'grafanacloud-ckbedwellksix-logs',
  meta: {
    id: 'loki',
    type: PluginType.datasource,
    name: 'Loki',
    info: {
      author: {
        name: 'Grafana Labs',
        url: 'https://grafana.com',
      },
      description: 'Like Prometheus but for logs. OSS logging solution from Grafana Labs',
      links: [
        {
          name: 'Learn more',
          url: 'https://grafana.com/loki',
        },
        {
          name: 'GitHub Project',
          url: 'https://github.com/grafana/loki',
        },
      ],
      logos: {
        small: 'public/app/plugins/datasource/loki/img/loki_icon.svg',
        large: 'public/app/plugins/datasource/loki/img/loki_icon.svg',
      },
      build: {},
      screenshots: [],
      version: '',
      updated: '',
    },
    dependencies: {
      grafanaDependency: '',
      grafanaVersion: '*',
      plugins: [],
    },
    category: 'logging',
    backend: true,
    annotations: true,
    metrics: true,
    alerting: true,
    logs: true,
    tracing: false,
    queryOptions: {
      maxDataPoints: true,
    },
    streaming: true,
    module: 'core:plugin/loki',
    baseUrl: 'public/app/plugins/datasource/loki',
    angular: {
      detected: false,
      hideDeprecation: false,
    },
  },
  url: '/api/datasources/proxy/uid/grafanacloud-logs',
  isDefault: false,
  access: 'proxy',
  jsonData: {
    derivedFields: [
      {
        datasourceUid: 'grafanacloud-traces',
        matcherRegex: '[tT]race_?[iI][dD]"?[:=]"?(\\w+)',
        name: 'traceID',
        url: '${__value.raw}',
      },
    ],
    timeout: '300',
  },
  readOnly: true,
  cachingConfig: {
    enabled: false,
    TTLMs: 0,
  },
};

export const SMDSSettings: DataSourceInstanceSettings<SMOptions> = {
  id: 32,
  uid: 'testuid',
  type: 'synthetic-monitoring-datasource',
  name: 'Synthetic Monitoring',
  access: 'proxy',
  readOnly: false,
  url: ``,
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
    signature: PluginSignatureStatus.valid,
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
        title: 'Synthetic Monitoring DNS',
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
      grafanaName: LogsDSSettings.name,
      hostedId: LogsDSSettings.id,
      type: LogsDSSettings.type,
      uid: LogsDSSettings.uid,
    },
    metrics: {
      grafanaName: MetricsDSSettings.name,
      hostedId: MetricsDSSettings.id,
      type: MetricsDSSettings.type,
      uid: MetricsDSSettings.uid,
    },
  },
};
