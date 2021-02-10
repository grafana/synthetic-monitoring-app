import { PluginConfigPageProps, AppPluginMeta } from '@grafana/data';
import { ConfigActions } from 'components/ConfigActions';
import { InstanceProvider } from 'components/InstanceProvider';
import { TenantSetup } from 'components/TenantSetup';
import React, { PureComponent } from 'react';
import { GlobalSettings } from 'types';

interface Props extends PluginConfigPageProps<AppPluginMeta<GlobalSettings>> {}

export class ConfigPage extends PureComponent<Props> {
  render() {
    const { plugin } = this.props;

    return (
      <InstanceProvider
        metricInstanceName={plugin.meta.jsonData?.metrics?.grafanaName}
        logsInstanceName={plugin.meta.jsonData?.logs?.grafanaName}
        meta={plugin.meta}
      >
        <div>
          <div className="card-item">
            <div>
              <h4>Synthetic Monitoring App</h4>
            </div>
            <div>
              <p>
                Synthetic Monitoring is a blackbox monitoring solution provided as part of{' '}
                <a
                  className="highlight-word"
                  href="https://grafana.com/products/cloud/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Grafana Cloud
                </a>
                . If you don&apos;t already have a Grafana Cloud service,{' '}
                <a
                  className="highlight-word"
                  href="https://grafana.com/signup/cloud"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  sign up now{' '}
                </a>
              </p>
            </div>
            <div>
              <p>
                Synthetic Monitoring is a blackbox monitoring solution provided as part of{' '}
                <a
                  className="highlight-word"
                  href="https://grafana.com/products/cloud/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Grafana Cloud
                </a>
                .
              </p>
            </div>
          </div>
          <br />
          <TenantSetup />
          <br />
          <ConfigActions />
        </div>
      </InstanceProvider>
    );
  }
}
