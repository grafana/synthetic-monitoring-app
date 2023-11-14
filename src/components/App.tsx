import React, { PureComponent } from 'react';
import { AppRootProps } from '@grafana/data';

import { GlobalSettings } from 'types';
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
        <InstanceProvider
          metricInstanceName={meta.jsonData?.metrics?.grafanaName}
          logsInstanceName={meta.jsonData?.logs?.grafanaName}
          meta={meta}
        >
          <ChecksContextProvider>
            <CheckInfoContextProvider>
              <Routing {...this.props} />
              <DashboardUpdateModal />
            </CheckInfoContextProvider>
          </ChecksContextProvider>
        </InstanceProvider>
      </FeatureFlagProvider>
    );
  }
}
