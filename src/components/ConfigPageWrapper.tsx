import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppPluginMeta, PluginConfigPageProps } from '@grafana/data';

import { GlobalSettings } from 'types';
import { MetaContextProvider } from 'contexts/MetaContext';
import { queryClient } from 'data/queryClient';
import { InstanceProvider } from 'components/InstanceProvider';
import { ConfigPage } from 'page/ConfigPage';

interface Props extends PluginConfigPageProps<AppPluginMeta<GlobalSettings>> {}

export const ConfigPageWrapper = ({ plugin }: Props) => {
  return (
    <MetaContextProvider meta={plugin.meta}>
      <InstanceProvider
        metricInstanceName={plugin.meta.jsonData?.metrics?.grafanaName}
        logsInstanceName={plugin.meta.jsonData?.logs?.grafanaName}
      >
        <QueryClientProvider client={queryClient}>
          <ConfigPage />
        </QueryClientProvider>
      </InstanceProvider>
    </MetaContextProvider>
  );
};
