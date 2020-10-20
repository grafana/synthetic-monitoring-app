import { AppPluginMeta } from '@grafana/data';
import { SMDataSource } from 'datasource/DataSource';
import { createContext } from 'react';
import { GlobalSettings, GrafanaInstances } from 'types';

interface InstanceContextValue {
  loading: boolean;
  instance: GrafanaInstances | undefined;
  updateApiDatasource: (api: SMDataSource) => void;
  meta: AppPluginMeta<GlobalSettings> | undefined;
}

export const InstanceContext = createContext<InstanceContextValue>({
  instance: undefined,
  loading: true,
  updateApiDatasource: () => {},
  meta: undefined,
});
