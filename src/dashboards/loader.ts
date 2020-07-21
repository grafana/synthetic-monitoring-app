import { getBackendSrv } from '@grafana/runtime';
import { DashboardInfo, FolderInfo, SMOptions } from 'datasource/types';

export const dashboardPaths = [
  'sm-http.json', // The path
  'sm-ping.json',
  'sm-dns.json',
  'sm-tcp.json',
  'sm-summary.json',
];

async function findSyntheticMonitoringFolder(): Promise<FolderInfo> {
  const backendSrv = getBackendSrv();
  const folders = (await backendSrv.get(`api/folders`)) as FolderInfo[];
  for (const folder of folders) {
    if (folder.title === 'Synthetic Monitoring') {
      return folder;
    }
  }

  return await backendSrv.post('api/folders', {
    title: 'Synthetic Monitoring',
  });
}

export async function importDashboard(path: string, options: SMOptions): Promise<DashboardInfo> {
  const backendSrv = getBackendSrv();

  const json = await backendSrv.get(`public/plugins/grafana-synthetic-monitoring-app/dashboards/${path}`);

  const folder = await findSyntheticMonitoringFolder();

  const info = await backendSrv.post('api/dashboards/import', {
    dashboard: json,
    overwrite: true, // UID?
    inputs: [
      { name: 'DS_SM_METRICS', type: 'datasource', pluginId: 'prometheus', value: options.metrics.grafanaName },
      { name: 'DS_SM_LOGS', type: 'datasource', pluginId: 'loki', value: options.logs.grafanaName },
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
    const json = await backendSrv.get(`public/plugins/grafana-synthetic-monitoring-app/dashboards/${p}`);

    const dInfo = {
      title: json.title,
      uid: json.uid,
      json: p,
      version: 0,
      latestVersion: json.version,
    };
    dashboards.push(dInfo);
  }
  return dashboards;
}

export async function removeDashboard(dashboard: DashboardInfo): Promise<any> {
  const backendSrv = getBackendSrv();
  return backendSrv.delete(`/api/dashboards/uid/${dashboard.uid}`);
}
