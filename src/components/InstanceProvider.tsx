import React, { PropsWithChildren, useEffect, useState } from 'react';
import { OrgRole } from '@grafana/data';
import { config, getBackendSrv, getDataSourceSrv } from '@grafana/runtime';
import appEvents from 'grafana/app/core/app_events';

import { GrafanaInstances } from 'types';
import { hasRole } from 'utils';
import { SMDataSource } from 'datasource/DataSource';
import { InstanceContext } from 'contexts/InstanceContext';

import { CenteredSpinner } from './CenteredSpinner';
import { PluginPage } from './PluginPage';

async function getRulerDatasource(metricDatasourceId?: number) {
  if (!metricDatasourceId || !hasRole(OrgRole.Admin)) {
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
  return rulers.find((ruler) => ruler.id === matchedRuler?.id);
}

async function fetchDatasources(
  metricInstanceName: string | undefined,
  logsInstanceName: string | undefined
): Promise<GrafanaInstances> {
  const dataSourceSrv = getDataSourceSrv();
  const smApi = (await dataSourceSrv.get('Synthetic Monitoring').catch((e) => undefined)) as SMDataSource | undefined;
  let metrics;
  const uidInDs = smApi?.instanceSettings?.jsonData?.metrics?.uid;
  // first try uid stored in datasource
  if (uidInDs) {
    metrics = await dataSourceSrv.get({ uid: uidInDs, type: 'prometheus' }).catch((e) => {});
  }

  // next try grafanaName in datasource
  const metricsName = smApi?.instanceSettings?.jsonData?.metrics?.grafanaName;

  if (!metrics && metricsName) {
    metrics = await dataSourceSrv.get(metricsName).catch((e) => {});
  }

  if (!metrics) {
    // try the grafanaName in the plugin
    await dataSourceSrv.get(metricInstanceName).catch((e) => {
      // last try default cloud uid
      return dataSourceSrv.get({ uid: 'grafanacloud-metrics' }).catch((e) => undefined);
    });
  }

  let logs;
  const logsUidInDs = smApi?.instanceSettings?.jsonData?.logs?.uid;
  // first try uid stored in datasource
  if (logsUidInDs) {
    logs = await dataSourceSrv.get({ uid: logsUidInDs, type: 'loki' }).catch((e) => {});
  }

  // next try grafanaName in datasource
  const logsName = smApi?.instanceSettings?.jsonData?.logs?.grafanaName;
  if (!logs && logsName) {
    logs = await dataSourceSrv.get(logsName).catch((e) => {});
  }

  if (!logs) {
    // try the grafanaName from the plugin
    logs = await dataSourceSrv.get(logsInstanceName).catch((e) => {
      // last try default cloud uid
      return dataSourceSrv.get('grafanacloud-logs').catch((e) => {});
    });
  }

  const alertRuler = await getRulerDatasource(metrics?.id);

  let tenant;
  try {
    tenant = await smApi?.getTenant();
  } catch (e: any) {
    console.error(e);
    appEvents.emit('alert-error', [`Api failed to connect: ${e.data.message}`, `please check API configuration`]);
    return {
      metrics,
      logs,
    } as GrafanaInstances;
  }

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
}

export const InstanceProvider = ({ children, metricInstanceName, logsInstanceName }: PropsWithChildren<Props>) => {
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
    return (
      <PluginPage>
        <CenteredSpinner />
      </PluginPage>
    );
  }

  // this case should theoretically be impossible, since we are setting 'instances' to an object in the failure case
  if (!instances) {
    throw new Error('There was an error finding datasources required for Synthetic Monitoring');
  }

  return <InstanceContext.Provider value={{ instance: instances }}>{children}</InstanceContext.Provider>;
};
