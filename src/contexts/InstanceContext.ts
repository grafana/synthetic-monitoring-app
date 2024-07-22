import { createContext } from 'react';

import type { GrafanaInstances } from 'types';

export interface InstanceContextValue {
  instance: GrafanaInstances;
}

export const InstanceContext = createContext<InstanceContextValue>({
  instance: {},
});
