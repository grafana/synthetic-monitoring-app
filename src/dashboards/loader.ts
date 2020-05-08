import { getBackendSrv } from '@grafana/runtime';
import { DashboardInfo, WorldpingOptions } from 'datasource/types';

export const dashboardPaths = [
  'worldping-http.json', // The path
  'worldping-icmp.json',
  'worldping-summary.json',
];

export async function importDashboard(path: string, options: WorldpingOptions): Promise<DashboardInfo> {
  const backendSrv = getBackendSrv();

  const json = await backendSrv.get(`public/plugins/grafana-worldping-app/dashboards/${path}`);
  // ??? Change the UID ????

  const info = await backendSrv.post('api/dashboards/import', {
    dashboard: json,
    overwrite: true, // UID?
    inputs: [
      { name: 'DS_WORLDPING_METRICS', type: 'datasource', pluginId: 'prometheus', value: options.metrics.grafanaName },
      { name: 'DS_WORLDPING_LOGS', type: 'datasource', pluginId: 'loki', value: options.logs.grafanaName },
    ],
    folderId: 0,
  });
  console.log('imported', info);

  return {
    title: info.title,
    uid: json.uid,
    json: path,
  };
}
