import { css, Global } from '@emotion/react';
import React, { PureComponent } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AppRootProps } from '@grafana/data';

import { GlobalSettings } from 'types';
import { queryClient } from 'data/queryClient';
import { DashboardUpdateModal } from 'components/DashboardUpdateModal';
import { InstanceProvider } from 'components/InstanceProvider';
import { Routing } from 'components/Routing';

import { CheckInfoContextProvider } from './CheckInfoContextProvider';
import { ChecksContextProvider } from './ChecksContextProvider';
import { FeatureFlagProvider } from './FeatureFlagProvider';

export class App extends PureComponent<AppRootProps<GlobalSettings>> {
  render() {
    const { meta } = this.props;
    return (
      <FeatureFlagProvider>
        <GlobalStyles />
        <InstanceProvider
          metricInstanceName={meta.jsonData?.metrics?.grafanaName}
          logsInstanceName={meta.jsonData?.logs?.grafanaName}
          meta={meta}
        >
          <QueryClientProvider client={queryClient}>
            <ChecksContextProvider>
              <CheckInfoContextProvider>
                <Routing {...this.props} />
                <DashboardUpdateModal />
              </CheckInfoContextProvider>
            </ChecksContextProvider>
            <ReactQueryDevtools />
          </QueryClientProvider>
        </InstanceProvider>
      </FeatureFlagProvider>
    );
  }
}

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
