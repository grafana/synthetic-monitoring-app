import { createContext } from 'react';

import type { GrafanaInstances } from 'types';
import { SMDataSource } from 'datasource/DataSource';

export interface InstanceContextValue {
  instance: GrafanaInstances;
}

export const InstanceContext = createContext<InstanceContextValue>({
  instance: {
    api: undefined as unknown as SMDataSource,
  },
});
