import React, { PureComponent } from 'react';
import { InstanceProvider } from 'components/InstanceProvider';
import { PluginTabs } from 'components/PluginTabs';
import { AppRootProps } from '@grafana/data';
import { GlobalSettings } from 'types';
import { SuccessRateContextProvider } from './SuccessRateContextProvider';

export class App extends PureComponent<AppRootProps<GlobalSettings>> {
  render() {
    const { meta } = this.props;
    return (
      <InstanceProvider
        metricInstanceName={meta.jsonData?.metrics?.grafanaName}
        logsInstanceName={meta.jsonData?.logs?.grafanaName}
        meta={meta}
      >
        <SuccessRateContextProvider>
          <PluginTabs {...this.props} />
        </SuccessRateContextProvider>
      </InstanceProvider>
    );
  }
}
