import { createContext } from 'react';
import { GrafanaInstances } from 'types';

interface InstanceContextValue {
  loading: boolean;
  instance: GrafanaInstances | undefined;
}

export const InstanceContext = createContext<InstanceContextValue>({ instance: undefined, loading: true });
