import React, { useState, FC, useEffect } from 'react';
import { InstanceContext } from 'components/InstanceContext';
import { GlobalSettings, GrafanaInstances } from 'types';
import { SMOptions } from 'datasource/types';
import { getBackendSrv, getDataSourceSrv } from '@grafana/runtime';
import { SMDataSource } from 'datasource/DataSource';
import { Spinner } from '@grafana/ui';
import { AppPluginMeta } from '@grafana/data';

async function fetchDatasources(metricInstanceName: string, logsInstanceName: string): Promise<GrafanaInstances> {
  const dataSourceSrv = getDataSourceSrv();
  const smApi = (await dataSourceSrv.get('Synthetic Monitoring').catch(e => undefined)) as SMDataSource | undefined;
  const metrics = await dataSourceSrv.get(metricInstanceName);
  const logs = await dataSourceSrv.get(logsInstanceName);
  return {
    api: smApi,
    metrics,
    logs,
  };
}

interface Props {
  metricInstanceName: string;
  logsInstanceName: string;
  meta: AppPluginMeta<GlobalSettings>;
}

export const InstanceProvider: FC<Props> = ({ children, metricInstanceName, logsInstanceName, meta }) => {
  const [instances, setInstances] = useState<GrafanaInstances | null>(null);
  const [instancesLoading, setInstancesLoading] = useState(true);
  const updateApiDatasource = async (api: SMOptions) => {
    const next = new SMDataSource(api);
    console.log({ original: instances.api, next });
    setInstances({
      ...instances,
      api: next,
    });
  };

  useEffect(() => {
    setInstancesLoading(true);
    fetchDatasources(metricInstanceName, logsInstanceName).then(loadedInstances => {
      setInstances(loadedInstances);
      setInstancesLoading(false);
    });
  }, []);

  console.log('instancesl', instances);
  console.log('instances loading', instancesLoading);

  if (instancesLoading || !instances) {
    return <Spinner />;
  }
  return (
    <InstanceContext.Provider value={{ meta, instance: instances, loading: instancesLoading, updateApiDatasource }}>
      {children}
    </InstanceContext.Provider>
  );
};
