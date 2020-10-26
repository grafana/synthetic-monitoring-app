import React, { PureComponent } from 'react';
import { InstanceProvider } from 'components/InstanceProvider';
import { PluginTabs } from 'components/PluginTabs';
import { AppRootProps } from '@grafana/data';
import { GlobalSettings } from 'types';
import { config } from '@grafana/runtime';

export class App extends PureComponent<AppRootProps<GlobalSettings>> {
  render() {
    const { meta, ...rest } = this.props;
    console.log({ meta, rest });
    console.log({ config });
    return (
      <InstanceProvider
        metricInstanceName={meta.jsonData?.metrics?.grafanaName}
        logsInstanceName={meta.jsonData?.logs?.grafanaName}
        meta={meta}
      >
        <PluginTabs {...this.props} />
      </InstanceProvider>
    );
  }
}
