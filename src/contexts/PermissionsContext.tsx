import React, { createContext, PropsWithChildren, useContext } from 'react';

import { useDSAccessControl } from 'data/useDSAccessControl';
import { useLogsDS } from 'hooks/useLogsDS';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useSMDS } from 'hooks/useSMDS';

type PermissionsContextValue = {
  smDS: string[];
  metricsDS: string[];
  logsDS: string[];
} | null;

export const PermissionsContext = createContext<PermissionsContextValue>(null);

interface PermissionsContextProviderProps extends PropsWithChildren {}

export const PermissionsContextProvider = ({ children }: PermissionsContextProviderProps) => {
  const smDS = useSMDS();
  const metricsDS = useMetricsDS();
  const logsDS = useLogsDS();

  const { data: smAccessControl } = useDSAccessControl(smDS.uid);
  const { data: metricsAccessControl } = useDSAccessControl(metricsDS.uid);
  const { data: logsAccessControl } = useDSAccessControl(logsDS.uid);

  if (!smAccessControl || !metricsAccessControl || !logsAccessControl) {
    return null;
  }

  console.log({ smAccessControl, metricsAccessControl, logsAccessControl });

  return (
    <PermissionsContext.Provider
      value={{ smDS: smAccessControl, metricsDS: metricsAccessControl, logsDS: logsAccessControl }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export function usePermissionsContext() {
  const context = useContext(PermissionsContext);

  if (!context) {
    throw new Error('usePermissionsContext must be used within a PermissionsContextProvider');
  }

  return context;
}
