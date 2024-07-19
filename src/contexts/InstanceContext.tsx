import React, { createContext, PropsWithChildren, useContext } from 'react';
import { AppPluginMeta } from '@grafana/data';

import type { GlobalSettings } from 'types';
import { SMDataSource } from 'datasource/DataSource';
import { useSetupSMDatasource } from 'data/useSetupSMDatasource';
import { CenteredSpinner } from 'components/CenteredSpinner';
import { PluginPage } from 'components/PluginPage';
import { UninitialisedRouter } from 'page/Uninitialised';

type InstanceContextValue = {
  smDS: SMDataSource;
  meta: AppPluginMeta<GlobalSettings>;
} | null;

export const InstanceContext = createContext<InstanceContextValue>(null);

interface InstanceContextProviderProps extends PropsWithChildren {
  meta: AppPluginMeta<GlobalSettings>;
}

export const InstanceContextProvider = ({ children, meta }: InstanceContextProviderProps) => {
  const { data, isLoading } = useSetupSMDatasource();

  if (isLoading) {
    return (
      <PluginPage>
        <CenteredSpinner />
      </PluginPage>
    );
  }

  if (!data) {
    return <UninitialisedRouter />;
  }

  return <InstanceContext.Provider value={{ meta, smDS: data }}>{children}</InstanceContext.Provider>;
};

export function useInstances() {
  const context = useContext(InstanceContext);

  if (!context) {
    throw new Error('useInstances must be used within a InstanceContextProvider');
  }

  return context;
}
