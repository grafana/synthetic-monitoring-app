import React, { createContext, PropsWithChildren, useContext } from 'react';
import { PluginPage } from '@grafana/runtime';

import { SMDataSource } from 'datasource/DataSource';
import { useGetSMDatasource } from 'data/useSMSetup';
import { CenteredSpinner } from 'components/CenteredSpinner';
import { UninitialisedRouter } from 'components/Routing';

type SMDatasourceContextValue = {
  smDS: SMDataSource;
} | null;

export const SMDatasourceContext = createContext<SMDatasourceContextValue>(null);

export const SMDatasourceProvider = ({ children }: PropsWithChildren) => {
  const { data, isLoading } = useGetSMDatasource();

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

  return <SMDatasourceContext.Provider value={{ smDS: data }}>{children}</SMDatasourceContext.Provider>;
};

export function useSMDatasourceContext() {
  const context = useContext(SMDatasourceContext);

  if (!context) {
    throw new Error('useSMDatasourceContext must be used within a SMDatasourceProvider');
  }

  return context;
}
