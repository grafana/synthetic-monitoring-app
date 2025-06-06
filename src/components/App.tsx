import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AppRootProps } from '@grafana/data';
import { css, Global } from '@emotion/react';

import { ProvisioningJsonData } from 'types';
import { InitialisedRouter } from 'routing/InitialisedRouter';
import { MetaContextProvider } from 'contexts/MetaContext';
import { PermissionsContextProvider } from 'contexts/PermissionsContext';
import { SMDatasourceProvider } from 'contexts/SMDatasourceContext';
import { queryClient } from 'data/queryClient';
import { queryKeys as alertingQueryKeys } from 'data/useAlerts';

import { DevTools } from './DevTools';
import { FeatureFlagProvider } from './FeatureFlagProvider';

export const App = (props: AppRootProps<ProvisioningJsonData>) => {
  const { meta } = props;

  useEffect(() => {
    return () => {
      // we have a dependency on alerts to display our alerting correctly
      // so we are invalidating the alerts list on the assumption the user might change their alerting options when they leave SM
      // going to leave this despite it being a little bit buggy as the idea is correct (well, it should be invalidateQueries...)
      // alerting have some aggressive caching going on so I'm finding testing this hard
      queryClient.removeQueries({ queryKey: alertingQueryKeys.list });
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <MetaContextProvider meta={meta}>
        <FeatureFlagProvider>
          <GlobalStyles />
          <SMDatasourceProvider>
            <PermissionsContextProvider>
              <DevTools>
                <InitialisedRouter />
              </DevTools>
            </PermissionsContextProvider>
            <ReactQueryDevtools />
          </SMDatasourceProvider>
        </FeatureFlagProvider>
      </MetaContextProvider>
    </QueryClientProvider>
  );
};

const GlobalStyles = () => {
  return (
    <Global
      styles={css({
        ['kbd']: {
          backgroundColor: '#eee',
          borderRadius: '3px',
          border: '1px solid #b4b4b4',
          boxShadow: '0 1px 1px rgba(0, 0, 0, 0.2), 0 2px 0 0 rgba(255, 255, 255, 0.7) inset',
          color: '#333',
          display: 'inline-block',
          fontSize: '0.85em',
          fontWeight: 700,
          lineHeight: 1,
          padding: '2px 4px',
          whiteSpace: 'nowrap',
        },
      })}
    />
  );
};
