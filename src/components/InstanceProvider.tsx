import React, { useState, FC, useEffect } from 'react';
import { InstanceContext } from 'components/InstanceContext';
import { GlobalSettings, GrafanaInstances } from 'types';
import { getDataSourceSrv } from '@grafana/runtime';
import { SMDataSource } from 'datasource/DataSource';
import { Spinner } from '@grafana/ui';
import { AppPluginMeta } from '@grafana/data';
import { UnprovisionedSetup } from 'components/UnprovisionedSetup';

async function fetchDatasources(
  metricInstanceName: string | undefined,
  logsInstanceName: string | undefined
): Promise<GrafanaInstances> {
  const dataSourceSrv = getDataSourceSrv();
  const smApi = (await dataSourceSrv.get('Synthetic Monitoring').catch(e => undefined)) as SMDataSource | undefined;
  const metricsName = metricInstanceName ?? smApi?.instanceSettings?.jsonData?.metrics?.grafanaName;
  const metrics = metricsName ? await dataSourceSrv.get(metricsName).catch(e => undefined) : undefined;

  const logsName = logsInstanceName ?? smApi?.instanceSettings?.jsonData?.logs?.grafanaName;
  const logs = logsName ? await dataSourceSrv.get(logsName).catch(e => undefined) : undefined;
  return {
    api: smApi,
    metrics,
    logs,
  };
}

interface Props {
  metricInstanceName?: string;
  logsInstanceName?: string;
  meta: AppPluginMeta<GlobalSettings>;
}

export const InstanceProvider: FC<Props> = ({ children, metricInstanceName, logsInstanceName, meta }) => {
  const [instances, setInstances] = useState<GrafanaInstances | null>(null);
  const [instancesLoading, setInstancesLoading] = useState(true);
  useEffect(() => {
    setInstancesLoading(true);
    fetchDatasources(metricInstanceName, logsInstanceName).then(loadedInstances => {
      if (!loadedInstances.metrics || !loadedInstances.logs) {
        fetchDatasources('Synthetic Monitoring Metrics', 'Synthetic Monitoring Logs').then(fallbackLoadedInstances => {
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

  if (!instances.metrics || !instances.logs) {
    return <UnprovisionedSetup pluginId={meta.id} pluginName={meta.name} />;
  }
  return (
    <InstanceContext.Provider value={{ meta, instance: instances, loading: instancesLoading }}>
      {children}
    </InstanceContext.Provider>
  );
};
