import { PluginConfigPageProps, AppPluginMeta } from '@grafana/data';
import { Button } from '@grafana/ui';
import { InstanceProvider } from 'components/InstanceProvider';
import { TenantSetup } from 'components/TenantSetup';
import React, { PureComponent } from 'react';
import { GlobalSettings } from 'types';

type AppSettings = {};

interface Props extends PluginConfigPageProps<AppPluginMeta<GlobalSettings>> {}

export class ConfigPage extends PureComponent<Props> {
  handleDisable = () => {
    console.log('disable');
  };

  render() {
    const { plugin } = this.props;

    return (
      <InstanceProvider
        metricInstanceName={plugin.meta.jsonData?.metrics?.grafanaName}
        logsInstanceName={plugin.meta.jsonData?.logs?.grafanaName}
        meta={plugin.meta}
      >
        <div>
          <h1>Hi</h1>
          <div className="card-item">
            <div>
              <h4>Synthetic Monitoring App</h4>
            </div>
            <div ng-if="!ctrl.configured">
              <p>
                Synthetic Monitoring is a blackbox monitoring solution provided as part of{' '}
                <a className="highlight-word" href="https://grafana.com/products/cloud/" target="_blank">
                  Grafana Cloud
                </a>
                . If you don't already have a Grafana Cloud service,{' '}
                <a className="highlight-word" href="https://grafana.com/signup/cloud" target="_blank">
                  sign up now{' '}
                </a>
                <br />
                <br />
                Click below to enable and initialize the App and start monitoring your network services today.
              </p>
            </div>
            <div ng-if="ctrl.configured">
              <p>
                Synthetic Monitoring is a blackbox monitoring solution provided as part of{' '}
                <a className="highlight-word" href="https://grafana.com/products/cloud/" target="_blank">
                  Grafana Cloud
                </a>
                .
                <br />
                <br />
                Click <b>Update</b> to edit the App's configuration.
              </p>
            </div>
          </div>
          <TenantSetup />
          <Button variant="destructive" onClick={this.handleDisable}>
            Disable synthetic monitoring
          </Button>
        </div>
      </InstanceProvider>
    );
  }
}
