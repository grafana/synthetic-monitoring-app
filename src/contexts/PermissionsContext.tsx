import React, { createContext, PropsWithChildren, useContext } from 'react';
import { PluginPage } from '@grafana/runtime';

import { useDSAccessControl } from 'data/useDSAccessControl';
import { useLogsDS } from 'hooks/useLogsDS';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useSMDS } from 'hooks/useSMDS';
import { CenteredSpinner } from 'components/CenteredSpinner';

type PermissionsContextValue = {
  smDS: string[];
  metricsDS: string[];
  logsDS: string[];
} | null;

export const PermissionsContext = createContext<PermissionsContextValue>(null);

export const PermissionsContextProvider = ({ children }: PropsWithChildren) => {
  const smDS = useSMDS();
  const metricsDS = useMetricsDS();
  const logsDS = useLogsDS();

  const { data: smAccessControl = [], isLoading: smLoading } = useDSAccessControl(smDS.uid);
  const { data: metricsAccessControl = [], isLoading: metricsLoading } = useDSAccessControl(metricsDS?.uid);
  const { data: logsAccessControl = [], isLoading: logsLoading } = useDSAccessControl(logsDS?.uid);

  if (smLoading || metricsLoading || logsLoading) {
    return (
      <PluginPage>
        <CenteredSpinner />
      </PluginPage>
    );
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
