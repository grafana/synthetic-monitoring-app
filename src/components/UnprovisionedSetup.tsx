import React, { useState } from 'react';
import TenantApiSetupForm from 'components/TenantAPISetupForm';
import { DEFAULT_API_HOST } from 'components/constants';
import { InstanceSelection } from 'components/InstanceSelection';
import { RegistrationInfo } from 'types';
import {
  getOrCreateMetricAndLokiDatasources,
  initializeSMDatasource,
  initializeTenant,
  saveTenantInstanceIds,
  updatePluginJsonData,
} from 'initialization-utils';
import { trackEvent, trackException } from 'analytics';
import { PluginPage } from 'components/PluginPage';

interface ApiSetupValues {
  adminApiToken: string;
  apiHost?: string;
}

interface Props {
  pluginId: string;
  pluginName: string;
}

/* 
This component exists to facilitate bootstrapping the app from an unprovisioned state (i.e. a Grafana instance running on prem)
We need to do the following things in the setup process:
1. Post an admin token to the proxied init endpoint
2. We receive back a list of instances hosted in Grafana Cloud and an accessToken from the init endpoint
3. Present the instances for selection by the user
4. Once the desired instances are selected, we need to create the SM datasource with the accessToken and SM API url in the jsonData so it can be used in subsequent requests to the SM API
5. Ensure there are datasources for the selected metrics and logs instances (if not, create them)
6. Store metadata about the metrics and logs instances in the SM datasource
7. Import all the dashboards (the name of the newly created logs/metrics datasources is required for this)
8. Send the selected metric and logs instance metadata to the SM API (with the register/save endpoint)
9. Reload the page and let the routing take control
*/

export const UnprovisionedSetup = ({ pluginId }: Props) => {
  const [apiSetup, setApiSetup] = useState<ApiSetupValues | undefined>();
  const [apiSetupError, setApiSetupError] = useState<string | undefined>();
  const [tenantInfo, setTenantInfo] = useState<RegistrationInfo | undefined>();
  const [instanceSelectionError, setInstanceSelectionError] = useState<string | undefined>();

  const onSetupSubmit = async (setupValues: ApiSetupValues) => {
    // put api host in plugin jsonData
    try {
      trackEvent('unprovisionedSetupSubmit');
      await updatePluginJsonData(pluginId, { apiHost: apiSetup?.apiHost ?? DEFAULT_API_HOST });
      const tenantInfo = await initializeTenant(pluginId, setupValues.adminApiToken);
      setTenantInfo(tenantInfo);
      setApiSetup(setupValues);
    } catch (e) {
      const err = e as Error;
      trackException(`unprovisionedSetupSubmit error: ${err.message}`);
      setApiSetupError(err.message);
    }
  };

  const onInstanceSelectionSubmit = async (metricsInstanceId?: number, logsInstanceId?: number) => {
    if (!metricsInstanceId || !logsInstanceId) {
      setInstanceSelectionError('A logs and metrics instance must be selected');
      return;
    }

    if (!apiSetup || !apiSetup.apiHost || !tenantInfo?.accessToken) {
      setInstanceSelectionError('Something went wrong setting up Synthetic Monitoring. Please refresh the page.');
      return;
    }

    const hostedMetrics = tenantInfo?.instances.find(({ id }) => id === metricsInstanceId);
    const hostedLogs = tenantInfo?.instances.find(({ id }) => id === logsInstanceId);
    if (!hostedMetrics) {
      setInstanceSelectionError('Missing metrics instance');
      return;
    }
    if (!hostedLogs) {
      setInstanceSelectionError('Missing logs instance');
      return;
    }

    try {
      const smDatasource = await initializeSMDatasource(apiSetup.apiHost, tenantInfo.accessToken);
      await getOrCreateMetricAndLokiDatasources({
        hostedLogs,
        hostedMetrics,
        adminApiToken: apiSetup.adminApiToken,
        smDatasource,
      });

      await updatePluginJsonData(pluginId, {
        logs: {
          grafanaName: `grafanacloud-${hostedLogs.name}`,
          hostedId: hostedLogs.id,
        },
        metrics: {
          grafanaName: `grafanacloud-${hostedMetrics.name}`,
          hostedId: hostedMetrics.id,
        },
      });

      await saveTenantInstanceIds(apiSetup.adminApiToken, hostedMetrics.id, hostedLogs.id, smDatasource.id);
    } catch (e) {
      const err = e as Error;
      setInstanceSelectionError(err.message);
      return;
    }

    window.location.reload();
  };

  if (tenantInfo) {
    return (
      <PluginPage pageNav={{ text: 'Setup', description: 'Set up the plugin' }}>
        <InstanceSelection
          logsInstances={tenantInfo.instances.filter((instance) => instance.type === 'logs')}
          metricsInstances={tenantInfo.instances.filter((instance) => instance.type === 'prometheus')}
          onSubmit={onInstanceSelectionSubmit}
          error={instanceSelectionError}
        />
      </PluginPage>
    );
  }

  return (
    <PluginPage pageNav={{ text: 'Setup', description: 'Set up the plugin' }}>
      <TenantApiSetupForm onSubmit={onSetupSubmit} submissionError={apiSetupError} />
    </PluginPage>
  );
};
