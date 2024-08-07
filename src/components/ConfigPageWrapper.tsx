import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppPluginMeta, PluginConfigPageProps } from '@grafana/data';

import { ProvisioningJsonData } from 'types';
import { MetaContextProvider } from 'contexts/MetaContext';
import { SMDatasourceProvider } from 'contexts/SMDatasourceContext';
import { queryClient } from 'data/queryClient';
import { ConfigPage } from 'page/ConfigPage';

export const ConfigPageWrapper = ({ plugin }: PluginConfigPageProps<AppPluginMeta<ProvisioningJsonData>>) => {
  return (
    <QueryClientProvider client={queryClient}>
      <MetaContextProvider meta={plugin.meta}>
        <SMDatasourceProvider>
          <ConfigPage />
        </SMDatasourceProvider>
      </MetaContextProvider>
    </QueryClientProvider>
  );
};
