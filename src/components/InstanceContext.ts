import { AppPluginMeta } from '@grafana/data';
import { createContext } from 'react';
import { GlobalSettings, GrafanaInstances } from 'types';

interface InstanceContextValue {
  loading: boolean;
  instance: GrafanaInstances | undefined;
  meta: AppPluginMeta<GlobalSettings> | undefined;
}

export const InstanceContext = createContext<InstanceContextValue>({
  instance: undefined,
  loading: true,
  meta: undefined,
});
