import { PluginMeta } from '@grafana/data';
import { config, getBackendSrv } from '@grafana/runtime';
import { importAllDashboards } from 'dashboards/loader';
import { HostedInstance, RegistrationInfo } from 'types';
import { createDatasource, findHostedInstance, getHostedLokiAndPrometheusInfo } from 'utils';

export const fetchPluginSettings = async (pluginId: string) =>
  await getBackendSrv().get(`api/plugins/${pluginId}/settings`);

export const updatePluginJsonData = async (pluginId: string, jsonData: any) => {
  const pluginSettings = await fetchPluginSettings(pluginId);
  await getBackendSrv().post(`api/plugins/${pluginId}/settings`, {
    ...pluginSettings,
    jsonData: {
      ...(pluginSettings.jsonData ?? {}),
      ...jsonData,
    },
  });
};

export const initializeTenant = async (pluginId: string, adminApiToken: string): Promise<RegistrationInfo> => {
  return await getBackendSrv()
    .request({
      url: `api/plugin-proxy/${pluginId}/init`,
      method: 'POST',
      data: {
        apiToken: adminApiToken,
      },
      headers: {
        // ensure the grafana backend doesn't use a cached copy of the
        // datasource config, as it might not have the new apiHost set.
        'X-Grafana-NoCache': 'true',
      },
    })
    .catch((err) => {
      if (err.data.msg) {
        throw new Error(err.data.msg);
      }
      if (err.statusText) {
        throw new Error(`${err.status}: ${err.statusText}`);
      }
      throw new Error('Failed to initialize with provided Admin API Key');
    });
};

export const saveTenantInstanceIds = async (
  adminApiToken: string,
  metricsInstanceId: number,
  logsInstanceId: number,
  smDatasourceId: string
) =>
  await getBackendSrv().request({
    method: 'POST',
    url: `api/datasources/proxy/${smDatasourceId}/save`,
    headers: {
      // ensure the grafana backend doesn't use a cached copy of the
      // datasource config, as it might not have the new accessToken set.
      'X-Grafana-NoCache': 'true',
    },
    data: {
      apiToken: adminApiToken,
      metricsInstanceId,
      logsInstanceId,
    },
  });

export const initializeSMDatasource = async (apiHost: string, smApiAccessToken: string): Promise<PluginMeta> => {
  const smDatasource = config.datasources['Synthetic Monitoring'];

  // Create incomplete SM datasource with tenantInfo so we can proxy further requests with the SM access token
  const updateInfo = {
    name: 'Synthetic Monitoring',
    type: 'synthetic-monitoring-datasource',
    access: 'proxy',
    isDefault: false,
    jsonData: {
      apiHost: apiHost,
      initialized: false,
    },
    secureJsonData: {
      accessToken: smApiAccessToken,
    },
  };
  if (!smDatasource) {
    const datasourceResponse = await getBackendSrv().post('api/datasources', updateInfo);
    return datasourceResponse.datasource;
  }
  const datasourceResponse = await getBackendSrv().put(`api/datasources/${smDatasource.id}`, updateInfo);
  return datasourceResponse.datasource;
};

interface CreateDatasourcesArgs {
  hostedMetrics: HostedInstance;
  hostedLogs: HostedInstance;
  adminApiToken: string;
  smDatasource: PluginMeta;
}

export const getOrCreateMetricAndLokiDatasources = async ({
  hostedLogs,
  hostedMetrics,
  adminApiToken,
  smDatasource,
}: CreateDatasourcesArgs) => {
  const hostedDatasources = await getHostedLokiAndPrometheusInfo();
  const metricsDatasource =
    findHostedInstance(hostedDatasources, hostedMetrics) ??
    (await createDatasource(hostedMetrics, adminApiToken, smDatasource.id));

  const logsDatasource =
    findHostedInstance(hostedDatasources, hostedLogs) ??
    (await createDatasource(hostedLogs, adminApiToken, smDatasource.id));

  // add linked datasource info to sm datasource
  const dashboards = await importAllDashboards(
    metricsDatasource.uid ?? metricsDatasource.name,
    logsDatasource.uid ?? logsDatasource.name,
    smDatasource.name
  );
  await getBackendSrv().request({
    url: `api/datasources/${smDatasource.id}`,
    method: 'PUT',
    headers: {
      // ensure the grafana backend doesn't use a cached copy of the
      // datasource config, as it might not have the new accessToken set.
      'X-Grafana-NoCache': 'true',
    },
    data: {
      ...smDatasource,
      jsonData: {
        ...smDatasource.jsonData,
        logs: {
          grafanaName: logsDatasource.name,
          uid: logsDatasource.uid,
          hostedId: hostedLogs.id,
        },
        metrics: {
          grafanaName: metricsDatasource.name,
          uid: metricsDatasource.uid,
          hostedId: hostedMetrics.id,
        },
        dashboards,
        initialized: true,
      },
    },
  });
};
