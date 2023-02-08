import { PluginConfigPageProps, AppPluginMeta } from '@grafana/data';
import { InstanceProvider } from 'components/InstanceProvider';
import { ConfigPage } from 'page/ConfigPage';
import React, { PureComponent } from 'react';
import { GlobalSettings } from 'types';

interface Props extends PluginConfigPageProps<AppPluginMeta<GlobalSettings>> {}

export class ConfigPageWrapper extends PureComponent<Props> {
  render() {
    const { plugin } = this.props;

    return (
      <InstanceProvider
        metricInstanceName={plugin.meta.jsonData?.metrics?.grafanaName}
        logsInstanceName={plugin.meta.jsonData?.logs?.grafanaName}
        meta={plugin.meta}
      >
        <ConfigPage />
      </InstanceProvider>
    );
  }
}
