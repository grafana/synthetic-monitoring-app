import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from '@grafana/ui';

import { SyntheticChecksPanelProps } from './SyntheticChecksPanel.types';
import { SMDatasourceContext } from 'contexts/SMDatasourceContext';
import { useGetSMDatasource } from 'data/useSMSetup';
import { CenteredSpinner } from 'components/CenteredSpinner';

import { SyntheticChecksPanel } from './SyntheticChecksPanel';

const exposedQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      retry: false,
    },
  },
});

const SyntheticChecksPanelWithDatasource = (props: SyntheticChecksPanelProps) => {
  const { data: smDS, isLoading, isError } = useGetSMDatasource();

  if (isLoading) {
    return <CenteredSpinner />;
  }

  if (isError || !smDS) {
    return (
      <Alert severity="info" title="Synthetic Monitoring is not configured">
        The Synthetic Monitoring plugin needs to be configured before checks can be displayed.
      </Alert>
    );
  }

  return (
    <SMDatasourceContext.Provider value={{ smDS }}>
      <SyntheticChecksPanel {...props} />
    </SMDatasourceContext.Provider>
  );
};

const SyntheticChecksPanelExposed = (props: SyntheticChecksPanelProps) => {
  return (
    <QueryClientProvider client={exposedQueryClient}>
      <SyntheticChecksPanelWithDatasource {...props} />
    </QueryClientProvider>
  );
};

// eslint-disable-next-line no-restricted-syntax
export default SyntheticChecksPanelExposed;
