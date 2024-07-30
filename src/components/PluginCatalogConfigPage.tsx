import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppPluginMeta, PluginConfigPageProps } from '@grafana/data';

import { ProvisioningJsonData } from 'types';
import { MetaContextProvider } from 'contexts/MetaContext';
import { PermissionsContextProvider } from 'contexts/PermissionsContext';
import { SMDatasourceContext } from 'contexts/SMDatasourceContext';
import { queryClient } from 'data/queryClient';
import { useGetSMDatasource } from 'data/useSMSetup';
import { ConfigPage } from 'page/ConfigPage';

export const PluginCatalogConfigPage = ({ plugin }: PluginConfigPageProps<AppPluginMeta<ProvisioningJsonData>>) => {
  return (
    <QueryClientProvider client={queryClient}>
      <MetaContextProvider meta={plugin.meta}>
        <PluginCatalogConfigPageContent />
      </MetaContextProvider>
    </QueryClientProvider>
  );
};

const PluginCatalogConfigPageContent = () => {
  const { data, isLoading } = useGetSMDatasource();

  if (isLoading) {
    return null;
  }

  if (!data) {
    return <ConfigPage />;
  }

  return (
    <SMDatasourceContext.Provider value={{ smDS: data }}>
      <PermissionsContextProvider>
        <ConfigPage initialized={Boolean(data)} />
      </PermissionsContextProvider>
    </SMDatasourceContext.Provider>
  );
};
