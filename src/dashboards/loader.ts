import { getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { DashboardInfo, FolderInfo } from 'datasource/types';

export const dashboardPaths = [
  'sm-http.json', // The path
  'sm-ping.json',
  'sm-dns.json',
  'sm-tcp.json',
  'sm-summary.json',
  'sm-traceroute.json',
];

async function findSyntheticMonitoringFolder(): Promise<FolderInfo> {
  const backendSrv = getBackendSrv();
  const folders = (await backendSrv.get(`api/folders`)) as FolderInfo[];
  const smFolder = folders.find((folder) => folder.title === 'Synthetic Monitoring');

  if (smFolder) {
    return smFolder;
  }

  return await backendSrv.post('api/folders', {
    title: 'Synthetic Monitoring',
  });
}

export async function importAllDashboards(
  metricsDatasourceName: string,
  logsDatasourceName: string,
  smDatasourceName: string
) {
  await findSyntheticMonitoringFolder();
  return Promise.all(
    dashboardPaths.map((path) => importDashboard(path, metricsDatasourceName, logsDatasourceName, smDatasourceName))
  );
}

export async function importDashboard(
  path: string,
  metricsDatasourceName: string,
  logsDatasourceName: string,
  smDatasourceName: string
): Promise<DashboardInfo> {
  const backendSrv = getBackendSrv();

  const json = await backendSrv.request({
    url: `public/plugins/grafana-synthetic-monitoring-app/dashboards/${path}`,
    method: 'GET',
    headers: { 'Cache-Control': 'no-store' },
  });

  const folder = await findSyntheticMonitoringFolder();

  const info = await backendSrv.post('api/dashboards/import', {
    dashboard: json,
    overwrite: true, // UID?
    inputs: [
      { name: 'DS_SM_METRICS', type: 'datasource', pluginId: 'prometheus', value: metricsDatasourceName },
      { name: 'DS_SM_LOGS', type: 'datasource', pluginId: 'loki', value: logsDatasourceName },
      { name: 'DS_SM_SM', type: 'datasource', pluginId: 'synthetic-monitoring-datasource', value: smDatasourceName },
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

export async function listAppDashboards() {
  let dashboards: DashboardInfo[] = [];

  for (const p of dashboardPaths) {
    const json = await firstValueFrom(
      getBackendSrv().fetch<DashboardInfo>({
        url: `public/plugins/grafana-synthetic-monitoring-app/dashboards/${p}`,
        method: 'GET',
        headers: { 'Cache-Control': 'no-store' },
      })
    ).then((res) => res.data);

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
