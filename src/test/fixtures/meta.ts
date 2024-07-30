import { PluginType } from '@grafana/data';
import pluginInfo from 'plugin.json';

export const SM_META = {
  id: pluginInfo.id,
  name: pluginInfo.name,
  type: PluginType.app,
  info: { ...pluginInfo.info, links: [] },
  module: `/public/plugins/grafana-synthetic-monitoring-app/module.js`,
  baseUrl: `/public/plugins/grafana-synthetic-monitoring-app`,
  enabled: true,
  jsonData: {
    metrics: {
      grafanaName: 'grafanacloud-prom',
      hostedId: 4,
    },
    logs: {
      grafanaName: 'grafanacloud-logs',
      hostedId: 8,
    },
    apiHost: 'https://synthetic-monitoring-api.grafana.net',
    stackId: 1,
  },
};
