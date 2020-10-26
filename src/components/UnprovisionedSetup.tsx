import React, { FC, useState } from 'react';
import TenantApiSetupForm from 'components/TenantAPISetupForm';
import { config, getBackendSrv } from '@grafana/runtime';
import { DEFAULT_API_HOST } from 'components/constants';
import { InstanceSelection } from 'components/InstanceSelection';
import { RegistrationInfo } from 'types';
import { createDatasource, createNewApiInstance, findHostedInstance, getHostedLokiAndPrometheusInfo } from 'utils';
import { importAllDashboards, listAppDashboards } from 'dashboards/loader';
import { SMDataSource } from 'datasource/DataSource';
import { Container } from '@grafana/ui';

interface ApiSetupValues {
  adminApiToken: string;
  apiHost?: string;
}

interface Props {
  pluginId: string;
  pluginName: string;
}

export const UnprovisionedSetup: FC<Props> = ({ pluginId, pluginName }) => {
  const [apiSetup, setApiSetup] = useState<ApiSetupValues | undefined>();
  const [apiSetupError, setApiSetupError] = useState<string | undefined>();
  const [tenantInfo, setTenantInfo] = useState<RegistrationInfo | undefined>();
  const [instanceSelectionError, setInstanceSelectionError] = useState<string | undefined>();

  const onSetupSubmit = async (setupValues: ApiSetupValues) => {
    // put api host in plugin jsonData
    const plugin = await getBackendSrv().get(`api/plugins/${pluginId}`);
    const pluginSettings = await getBackendSrv().get(`api/plugins/${pluginId}/settings`);
    try {
      await getBackendSrv().post(`api/plugins/${pluginId}/settings`, {
        ...pluginSettings,
        jsonData: {
          ...(pluginSettings.jsonData ?? {}),
          apiHost: apiSetup?.apiHost ?? DEFAULT_API_HOST,
        },
      });
      // send admin token to the SM api
      const info = await getBackendSrv()
        .request({
          url: `api/plugin-proxy/${pluginId}/init`,
          method: 'POST',
          data: {
            apiToken: setupValues.adminApiToken,
          },
          headers: {
            // ensure the grafana backend doesn't use a cached copy of the
            // datasource config, as it might not have the new apiHost set.
            'X-Grafana-NoCache': 'true',
          },
        })
        .catch(err => {
          if (err.data.msg) {
            throw new Error(err.data.msg);
          }
          if (err.statusText) {
            throw new Error(`${err.status}: ${err.statusText}`);
          }
          console.log({ err });
          throw new Error('Failed to initialize with provided Admin API Key');
        });

      console.log({ info });
      setTenantInfo(info);
      setApiSetup(setupValues);
    } catch (e) {
      setApiSetupError(e.message);
    }
  };

  const onInstanceSelectionSubmit = async (
    metricsInstanceId: number | undefined,
    logsInstanceId: number | undefined
  ) => {
    if (!metricsInstanceId || !logsInstanceId) {
      setInstanceSelectionError('A logs and metrics instance must be selected');
      return;
    }

    if (!apiSetup) {
      setInstanceSelectionError('Missing admin token and api host');
      return;
    }

    const hostedMetrics = tenantInfo?.instances.find(tenantInstance => tenantInstance.id === metricsInstanceId);
    const hostedLogs = tenantInfo?.instances.find(tenantInstance => tenantInstance.id === logsInstanceId);
    if (!hostedMetrics) {
      setInstanceSelectionError('Missing metrics instance');
      return;
    }
    if (!hostedLogs) {
      setInstanceSelectionError('Missing logs instance');
      return;
    }

    // const { instance } = this.props;
    // const { info, adminApiToken, apiHost } = this.state;
    // const name = instance?.instanceSettings.name;
    // if (!apiHost) {
    //   alert('Missing apiHost');
    //   return;
    // }

    const smDatasource = config.datasources['Synthetic Monitoring'];
    // Create incomplete SM datasource with tenantInfo so we can proxy further requests with the SM access token
    const updateInfo = {
      name: 'Synthetic Monitoring',
      type: 'synthetic-monitoring-datasource',
      access: 'proxy',
      isDefault: false,
      jsonData: {
        apiHost: apiSetup.apiHost,
        initialized: false,
      },
      secureJsonData: {
        accessToken: tenantInfo?.accessToken,
      },
    };
    let smDatasourceResponse;
    if (!smDatasource) {
      smDatasourceResponse = await getBackendSrv().post('api/datasources', updateInfo);
    } else {
      smDatasourceResponse = await getBackendSrv().put(`api/datasources/${smDatasource.id}`, updateInfo);
    }

    console.log(smDatasourceResponse);

    // check to see if log/metric ds exists
    // If so, post them to ds
    // If not, create and then post to ds
    // const dashboards =
    // await importAllDashboards()
    try {
      const hostedDatasources = await getHostedLokiAndPrometheusInfo();
      console.log('creating metrics datasource');
      const metricsDatasource =
        findHostedInstance(hostedDatasources, hostedMetrics) ??
        (await createDatasource(
          `${pluginName} Metrics`,
          hostedMetrics,
          apiSetup.adminApiToken,
          smDatasourceResponse.datasource.id
        ));

      const logsDatasource =
        findHostedInstance(hostedDatasources, hostedLogs) ??
        (await createDatasource(
          `${pluginName} Logs`,
          hostedLogs,
          apiSetup.adminApiToken,
          smDatasourceResponse.datasource.id
        ));

      console.log({ metricsDatasource, logsDatasource });
      // add linked datasource info to sm datasource
      const dashboards = await importAllDashboards(metricsDatasource.name, logsDatasource.name);
      await getBackendSrv().request({
        url: `api/datasources/${smDatasourceResponse.datasource.id}`,
        method: 'PUT',
        headers: {
          // ensure the grafana backend doesn't use a cached copy of the
          // datasource config, as it might not have the new accessToken set.
          'X-Grafana-NoCache': 'true',
        },
        data: {
          ...smDatasourceResponse.datasource,
          jsonData: {
            ...smDatasourceResponse.datasource.jsonData,
            logs: {
              grafanaName: `${pluginName} Logs`,
              hostedId: hostedLogs.id,
            },
            metrics: {
              grafanaName: `${pluginName} Metrics`,
              hostedId: hostedMetrics.id,
            },
            dashboards,
            initialized: true,
          },
        },
      });
      const pluginSettings = await getBackendSrv().get(`api/plugins/${pluginId}/settings`);
      await getBackendSrv().post(`api/plugins/${pluginId}/settings`, {
        ...pluginSettings,
        jsonData: {
          ...(pluginSettings.jsonData ?? {}),
          logs: {
            grafanaName: `${pluginName} Logs`,
            hostedId: hostedLogs.id,
          },
          metrics: {
            grafanaName: `${pluginName} Metrics`,
            hostedId: hostedMetrics.id,
          },
        },
      });
      console.log({ hostedMetrics, hostedLogs, tenantInfo, metricsInstanceId, logsInstanceId });
      await getBackendSrv().request({
        method: 'POST',
        url: `api/datasources/proxy/${smDatasourceResponse.datasource.id}/save`,
        headers: {
          // ensure the grafana backend doesn't use a cached copy of the
          // datasource config, as it might not have the new accessToken set.
          'X-Grafana-NoCache': 'true',
        },
        data: {
          apiToken: apiSetup.adminApiToken,
          metricsInstanceId: hostedMetrics.id,
          logsInstanceId: hostedLogs.id,
        },
      });
    } catch (e) {
      setInstanceSelectionError(e.message);
      return;
    }
    // Save the dashboard names
    // for (const json of dashboardPaths) {
    //   const d = await importDashboard(json, options);
    //   options.dashboards.push(d);
    // }
    // await instance!.registerSave(adminApiToken!, options, info?.accessToken!);
    // force reload so that GrafanaBootConfig is updated.
    window.location.reload();
  };

  if (!apiSetup) {
    return (
      <Container margin="lg" padding="lg">
        <TenantApiSetupForm onSubmit={onSetupSubmit} submissionError={apiSetupError} />
      </Container>
    );
  }
  if (tenantInfo) {
    return (
      <Container margin="lg" padding="lg">
        <InstanceSelection
          logsInstances={tenantInfo.instances.filter(instance => instance.type === 'logs')}
          metricsInstances={tenantInfo.instances.filter(instance => instance.type === 'prometheus')}
          onSubmit={onInstanceSelectionSubmit}
          error={instanceSelectionError}
        />
      </Container>
    );
  }
  return (
    <div>
      <div>Hello</div>
    </div>
  );
};
