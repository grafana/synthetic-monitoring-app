import { createContext } from 'react';
import { AppPluginMeta } from '@grafana/data';

import type { GlobalSettings, GrafanaInstances } from 'types';

export interface InstanceContextValue {
  loading: boolean;
  instance: GrafanaInstances;
  meta: AppPluginMeta<GlobalSettings> | undefined;
}

export const InstanceContext = createContext<InstanceContextValue>({
  instance: {},
  loading: true,
  meta: undefined,
});
