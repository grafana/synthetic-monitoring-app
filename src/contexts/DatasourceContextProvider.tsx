import React, { createContext, PropsWithChildren, useContext } from 'react';

import { SMDataSource } from 'datasource/DataSource';
import { useGetSMDatasource } from 'data/useSMDatasource';
import { CenteredSpinner } from 'components/CenteredSpinner';
import { PluginPage } from 'components/PluginPage';
import { UninitialisedRouter } from 'components/Routing';

type DatasourceContextValue = {
  smDS: SMDataSource;
} | null;

export const DatasourceContext = createContext<DatasourceContextValue>(null);

export const DatasourceContextProvider = ({ children }: PropsWithChildren) => {
  const { data, isLoading } = useGetSMDatasource();

  if (isLoading && !data) {
    return (
      <PluginPage>
        <CenteredSpinner />
      </PluginPage>
    );
  }

  if (!data) {
    return <UninitialisedRouter />;
  }

  return <DatasourceContext.Provider value={{ smDS: data }}>{children}</DatasourceContext.Provider>;
};

export function useDatasource() {
  const context = useContext(DatasourceContext);

  if (!context) {
    throw new Error('useDatasource must be used within a DatasourceContextProvider');
  }

  return context;
}
