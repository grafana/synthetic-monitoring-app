import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppPluginMeta, PluginConfigPageProps } from '@grafana/data';

import { GlobalSettings } from 'types';
import { InstanceContextProvider } from 'contexts/InstanceContext';
import { queryClient } from 'data/queryClient';
import { useSetupSMDatasource } from 'data/useSetupSMDatasource';
import { ConfigPage } from 'page/ConfigPage';

import { CenteredSpinner } from './CenteredSpinner';

export const ConfigPageWrapper = ({ plugin }: PluginConfigPageProps<AppPluginMeta<GlobalSettings>>) => {
  return (
    <QueryClientProvider client={queryClient}>
      <InstanceContextProvider meta={plugin.meta}>
        <ConfigPageWrapperContent />
      </InstanceContextProvider>
    </QueryClientProvider>
  );
};

const ConfigPageWrapperContent = () => {
  const { data, isLoading } = useSetupSMDatasource();

  if (isLoading) {
    return <CenteredSpinner />;
  }

  return <ConfigPage initialized={Boolean(data)} />;
};
