import React, { useState, useEffect, PropsWithChildren } from 'react';
import { InstanceContext } from 'components/InstanceContext';
import { GlobalSettings, GrafanaInstances, OrgRole } from 'types';
import { config, getDataSourceSrv, getBackendSrv } from '@grafana/runtime';
import { SMDataSource } from 'datasource/DataSource';
import { Spinner } from '@grafana/ui';
import { AppPluginMeta } from '@grafana/data';
import { UnprovisionedSetup } from 'components/UnprovisionedSetup';
import { hasRole } from 'utils';

async function getRulerDatasource(metricDatasourceId?: number) {
  if (!metricDatasourceId || !hasRole(OrgRole.ADMIN)) {
    return undefined;
  }
  const basicAuthUserId = await getBackendSrv()
    .get(`api/datasources/${metricDatasourceId}`)
    .then((settings) => settings.basicAuthUser);
  const rulers = Object.values(config.datasources).filter((ds) => ds.type === 'grafana-ruler-datasource');
  const rulerSettings = await Promise.all(
    rulers.map((ruler) => {
      return getBackendSrv().get(`api/datasources/${ruler.id}`);
    })
  );
  const matchedRuler = rulerSettings.find((ruler) => ruler.basicAuthUser === basicAuthUserId);
  return rulers.find((ruler) => ruler.id === matchedRuler.id);
}

async function fetchDatasources(
  metricInstanceName: string | undefined,
  logsInstanceName: string | undefined
): Promise<GrafanaInstances> {
  const dataSourceSrv = getDataSourceSrv();
  const smApi = (await dataSourceSrv.get('Synthetic Monitoring').catch((e) => undefined)) as SMDataSource | undefined;
  const metricsName = metricInstanceName ?? smApi?.instanceSettings?.jsonData?.metrics?.grafanaName;
  const metrics = metricsName ? await dataSourceSrv.get(metricsName).catch((e) => undefined) : undefined;

  const logsName = logsInstanceName ?? smApi?.instanceSettings?.jsonData?.logs?.grafanaName;
  const logs = logsName ? await dataSourceSrv.get(logsName).catch((e) => undefined) : undefined;

  const alertRuler = await getRulerDatasource(metrics?.id);

  const tenant = await smApi?.getTenant();

  if (!tenant || tenant.status === 1) {
    // If the tenant does not exist or has been deactivated, short circuit and kick the user back to the setup page
    return {
      metrics,
      logs,
    } as GrafanaInstances;
  }

  return {
    api: smApi,
    metrics,
    logs,
    alertRuler,
  } as GrafanaInstances;
}

interface Props {
  metricInstanceName?: string;
  logsInstanceName?: string;
  meta: AppPluginMeta<GlobalSettings>;
}

export const InstanceProvider = ({
  children,
  metricInstanceName,
  logsInstanceName,
  meta,
}: PropsWithChildren<Props>) => {
  const [instances, setInstances] = useState<GrafanaInstances | null>(null);
  const [instancesLoading, setInstancesLoading] = useState(true);
  useEffect(() => {
    setInstancesLoading(true);
    fetchDatasources(metricInstanceName, logsInstanceName).then((loadedInstances) => {
      if (!loadedInstances.metrics || !loadedInstances.logs) {
        const fallbackMetricDatasourceName =
          loadedInstances.api?.instanceSettings?.jsonData?.metrics?.grafanaName ?? 'Synthetic Monitoring Metrics';
        const fallbackLogsDatasourceName =
          loadedInstances.api?.instanceSettings?.jsonData?.logs?.grafanaName ?? 'Synthetic Monitoring Logs';
        fetchDatasources(fallbackMetricDatasourceName, fallbackLogsDatasourceName).then((fallbackLoadedInstances) => {
          setInstances(fallbackLoadedInstances);
          setInstancesLoading(false);
        });
        return;
      }
      setInstances(loadedInstances);
      setInstancesLoading(false);
    });
  }, [logsInstanceName, metricInstanceName]);

  if (instancesLoading) {
    return <Spinner />;
  }

  // this case should theoretically be impossible, since we are setting 'instances' to an object in the failure case
  if (!instances) {
    throw new Error('There was an error finding datasources required for Synthetic Monitoring');
  }

  if (meta.enabled && (!instances.metrics || !instances.logs)) {
    return <UnprovisionedSetup pluginId={meta.id} pluginName={meta.name} />;
  }
  console.log('hello', { instances });
  return (
    <InstanceContext.Provider value={{ meta, instance: instances, loading: instancesLoading }}>
      {children}
    </InstanceContext.Provider>
  );
};
