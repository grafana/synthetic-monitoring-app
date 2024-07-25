import {
  DataSourceInstanceSettings,
  PluginSignatureStatus,
  PluginType,
  WithAccessControlMetadata,
} from '@grafana/data';
import { SM_META } from 'test/fixtures/meta';

import { SMOptions } from 'datasource/types';

export const ADMIN_DEFAULT_DATASOURCE_ACCESS_CONTROL = {
  'alert.instances.external:read': true,
  'alert.instances.external:write': true,
  'alert.notifications.external:read': true,
  'alert.notifications.external:write': true,
  'alert.rules.external:read': true,
  'alert.rules.external:write': true,
  'datasources.caching:read': true,
  'datasources.caching:write': true,
  'datasources.id:read': true,
  'datasources.permissions:read': true,
  'datasources.permissions:write': true,
  'datasources:delete': true,
  'datasources:query': true,
  'datasources:read': true,
  'datasources:write': true,
};

export const EDITOR_DEFAULT_DATASOURCE_ACCESS_CONTROL = {
  'alert.instances.external:read': true,
  'alert.instances.external:write': true,
  'alert.notifications.external:read': true,
  'alert.notifications.external:write': true,
  'alert.rules.external:read': true,
  'alert.rules.external:write': true,
  'datasources.id:read': true,
  'datasources:delete': true,
  'datasources:query': true,
  'datasources:read': true,
  'datasources:write': true,
};

export const VIEWER_DEFAULT_DATASOURCE_ACCESS_CONTROL = {
  'alert.instances.external:read': true,
  'alert.instances.external:write': true,
  'alert.notifications.external:read': true,
  'alert.notifications.external:write': true,
  'alert.rules.external:read': true,
  'alert.rules.external:write': true,
  'datasources.id:read': true,
  'datasources:query': true,
  'datasources:read': true,
};

export const METRICS_DATASOURCE: DataSourceInstanceSettings<any> & WithAccessControlMetadata = {
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
  accessControl: ADMIN_DEFAULT_DATASOURCE_ACCESS_CONTROL,
};

export const LOGS_DATASOURCE: DataSourceInstanceSettings<any> & WithAccessControlMetadata = {
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
  accessControl: ADMIN_DEFAULT_DATASOURCE_ACCESS_CONTROL,
};

export const SM_DATASOURCE: DataSourceInstanceSettings<SMOptions> & WithAccessControlMetadata = {
  id: 6,
  uid: 'adsjbccbll2bkb',
  name: 'Synthetic Monitoring',
  type: 'synthetic-monitoring-datasource',
  access: 'proxy',
  url: '',
  withCredentials: false,
  isDefault: false,
  jsonData: {
    apiHost: 'https://synthetic-monitoring-api-dev.grafana-dev.net',
    initialized: true,
    logs: {
      grafanaName: 'grafanacloud-ckbedwellksix-logs',
      hostedId: 147960,
      type: 'loki',
      uid: 'P4DC6B4C9A7FFCC6C',
    },
    metrics: {
      grafanaName: 'grafanacloud-ckbedwellksix-prom',
      hostedId: 15629,
      type: 'prometheus',
      uid: 'P4DCEA413A673ADCC',
    },
  },
  meta: SM_META,
  readOnly: false,
  accessControl: ADMIN_DEFAULT_DATASOURCE_ACCESS_CONTROL,
};
