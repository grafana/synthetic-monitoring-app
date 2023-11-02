import React, { PureComponent } from 'react';
import { AppPluginMeta,PluginConfigPageProps } from '@grafana/data';

import { GlobalSettings } from 'types';
import { InstanceProvider } from 'components/InstanceProvider';
import { ConfigPage } from 'page/ConfigPage';

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
