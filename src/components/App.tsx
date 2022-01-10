import React, { PureComponent } from 'react';
import { InstanceProvider } from 'components/InstanceProvider';
import { DashboardUpdateModal } from 'components/DashboardUpdateModal';
import { AppRootProps } from '@grafana/data';
import { GlobalSettings } from 'types';
import { FeatureFlagProvider } from './FeatureFlagProvider';
import { CheckInfoContextProvider } from './CheckInfoContextProvider';
import { Routing } from 'components/Routing';

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
          <CheckInfoContextProvider>
            <Routing {...this.props} />
            <DashboardUpdateModal />
          </CheckInfoContextProvider>
        </InstanceProvider>
      </FeatureFlagProvider>
    );
  }
}
