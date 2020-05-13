import { getBackendSrv } from '@grafana/runtime';
import { DashboardInfo, FolderInfo, WorldpingOptions } from 'datasource/types';

export const dashboardPaths = [
  'worldping-http.json', // The path
  'worldping-icmp.json',
  'worldping-summary.json',
];

async function findWorldpingFolder(): Promise<FolderInfo> {
  const backendSrv = getBackendSrv();
  const folders = (await backendSrv.get(`api/folders`)) as FolderInfo[];
  for (const folder of folders) {
    if (folder.title === 'worldPing') {
      return folder;
    }
  }

  return await backendSrv.post('api/folders', {
    title: 'worldPing',
  });
}

export async function importDashboard(path: string, options: WorldpingOptions): Promise<DashboardInfo> {
  const backendSrv = getBackendSrv();

  const json = await backendSrv.get(`public/plugins/grafana-worldping-app/dashboards/${path}`);
  // ??? Change the UID ????

  const folder = await findWorldpingFolder();

  const info = await backendSrv.post('api/dashboards/import', {
    dashboard: json,
    overwrite: true, // UID?
    inputs: [
      { name: 'DS_WORLDPING_METRICS', type: 'datasource', pluginId: 'prometheus', value: options.metrics.grafanaName },
      { name: 'DS_WORLDPING_LOGS', type: 'datasource', pluginId: 'loki', value: options.logs.grafanaName },
    ],
    folderId: folder.id,
  });
  console.log('imported', info);

  return {
    title: info.title,
    uid: json.uid,
    json: path,
  };
}
