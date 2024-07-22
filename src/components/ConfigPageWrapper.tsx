import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppPluginMeta, PluginConfigPageProps } from '@grafana/data';

import { GlobalSettings } from 'types';
import { DatasourceContextProvider } from 'contexts/DatasourceContextProvider';
import { MetaContextProvider } from 'contexts/MetaContext';
import { queryClient } from 'data/queryClient';
import { useGetSMDatasource } from 'data/useSMDatasource';
import { ConfigPage } from 'page/ConfigPage';

import { CenteredSpinner } from './CenteredSpinner';

export const ConfigPageWrapper = ({ plugin }: PluginConfigPageProps<AppPluginMeta<GlobalSettings>>) => {
  return (
    <QueryClientProvider client={queryClient}>
      <MetaContextProvider meta={plugin.meta}>
        <DatasourceContextProvider>
          <ConfigPageWrapperContent />
        </DatasourceContextProvider>
      </MetaContextProvider>
    </QueryClientProvider>
  );
};

const ConfigPageWrapperContent = () => {
  const { data, isLoading } = useGetSMDatasource();

  if (isLoading) {
    return <CenteredSpinner />;
  }

  return <ConfigPage initialized={Boolean(data)} />;
};
