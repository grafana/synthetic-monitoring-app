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

  return {
    title: info.title,
    uid: json.uid,
    json: path,
    version: json.version,
    latestVersion: json.version,
  };
}

export async function listAppDashboards(): Promise<DashboardInfo[]> {
  const backendSrv = getBackendSrv();
  let dashboards: DashboardInfo[] = [];
  for (const p of dashboardPaths) {
    console.log('fetching dashboard', p);
    const json = await backendSrv.get(`public/plugins/grafana-worldping-app/dashboards/${p}`);

    const dInfo = {
      title: json.title,
      uid: json.uid,
      json: p,
      version: 0,
      latestVersion: json.version,
    };
    console.log('dashboard', dInfo);
    dashboards.push(dInfo);
  }
  return dashboards;
}

export async function removeDashboard(dashboard: DashboardInfo): Promise<any> {
  const backendSrv = getBackendSrv();
  return backendSrv.delete(`/api/dashboards/uid/${dashboard.uid}`);
}
