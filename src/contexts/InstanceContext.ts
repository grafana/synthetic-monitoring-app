import { AppPluginMeta } from '@grafana/data';
import { createContext } from 'react';
import { GlobalSettings, GrafanaInstances } from 'types';

export interface InstanceContextValue {
  loading: boolean;
  instance: GrafanaInstances;
  meta: AppPluginMeta<GlobalSettings> | undefined;
  provisioned?: boolean;
}

export const InstanceContext = createContext<InstanceContextValue>({
  instance: {},
  loading: true,
  meta: undefined,
  provisioned: false,
});
