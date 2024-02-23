import { createContext } from 'react';
import { AppPluginMeta } from '@grafana/data';

import type { GlobalSettings, GrafanaInstances } from 'types';
import { SMDataSource } from 'datasource/DataSource';

export interface InstanceContextValue {
  instance: GrafanaInstances;
  meta: AppPluginMeta<GlobalSettings> | undefined;
}

export const InstanceContext = createContext<InstanceContextValue>({
  instance: {
    api: undefined as unknown as SMDataSource,
  },
  meta: undefined,
});
