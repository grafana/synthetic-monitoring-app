import { PluginConfigPageProps, AppPluginMeta } from '@grafana/data';
import { getLocationSrv } from '@grafana/runtime';
import { Button, Spinner } from '@grafana/ui';
import { DisablePluginModal } from 'components/DisablePluginModal';
import { InstanceContext } from 'components/InstanceContext';
import { InstanceProvider } from 'components/InstanceProvider';
import { TenantSetup } from 'components/TenantSetup';
import React, { PureComponent } from 'react';
import { GlobalSettings } from 'types';

interface Props extends PluginConfigPageProps<AppPluginMeta<GlobalSettings>> {}

export class ConfigPage extends PureComponent<Props> {
  state = {
    showDisableModal: false,
  };

  handleDisable = () => {
    this.setState({ showDisableModal: true });
  };

  handleSetup = () => {
    getLocationSrv().update({
      partial: false,
      path: 'a/grafana-synthetic-monitoring-app/?page=setup',
      query: {
        page: 'setup',
      },
    });
  };

  closeModal = () => {
    this.setState({ showDisableModal: false });
  };

  render() {
    const { plugin } = this.props;
    const { showDisableModal } = this.state;

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
                <a className="highlight-word" href="https://grafana.com/products/cloud/" target="_blank">
                  Grafana Cloud
                </a>
                . If you don't already have a Grafana Cloud service,{' '}
                <a className="highlight-word" href="https://grafana.com/signup/cloud" target="_blank">
                  sign up now{' '}
                </a>
              </p>
            </div>
            <div>
              <p>
                Synthetic Monitoring is a blackbox monitoring solution provided as part of{' '}
                <a className="highlight-word" href="https://grafana.com/products/cloud/" target="_blank">
                  Grafana Cloud
                </a>
                .
              </p>
            </div>
          </div>
          <br />
          <TenantSetup />
          <br />
          <InstanceContext.Consumer>
            {({ instance, loading }) => {
              if (loading) {
                return <Spinner />;
              }
              if (instance?.api) {
                return (
                  <Button variant="destructive" onClick={this.handleDisable}>
                    Disable synthetic monitoring
                  </Button>
                );
              }
              return (
                <Button variant="primary" onClick={this.handleSetup}>
                  Setup
                </Button>
              );
            }}
          </InstanceContext.Consumer>
          <DisablePluginModal isOpen={showDisableModal} onDismiss={this.closeModal} />
        </div>
      </InstanceProvider>
    );
  }
}
