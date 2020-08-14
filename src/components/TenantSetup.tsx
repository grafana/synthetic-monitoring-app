import React, { PureComponent } from 'react';
import { Button, ConfirmModal } from '@grafana/ui';
import { RegistrationInfo, HostedInstance } from 'types';
import { SMDataSource } from 'datasource/DataSource';
import { isValid } from 'datasource/ConfigEditor';
import { InstanceList } from './InstanceList';
import { createHostedInstance, findHostedInstance, getHostedLokiAndPrometheusInfo } from 'utils';
import { SMOptions } from 'datasource/types';
import { TenantView } from './TenantView';
import { dashboardPaths, importDashboard } from 'dashboards/loader';
import { DashboardList } from './DashboardList';
import TenantAPISetupForm from './TenantAPISetupForm';
import { DEFAULT_API_HOST } from './constants';

interface Props {
  instance: SMDataSource;
}

interface State {
  adminApiToken?: string;
  apiHost?: string;
  userError?: string;
  backendError?: string;
  info?: RegistrationInfo;
  logsInstance?: number;
  metricsInstance?: number;
  showResetModal: boolean;
  resetConfig: boolean;
}

interface InitParams {
  adminApiToken: string;
  apiHost: string;
}

export class TenantSetup extends PureComponent<Props, State> {
  state: State = {
    showResetModal: false,
    resetConfig: false,
  };

  onInit = async ({ apiHost = DEFAULT_API_HOST, adminApiToken }: InitParams) => {
    const { instance } = this.props;

    const info = await instance.registerInit(apiHost, adminApiToken).catch(err => {
      console.error('failed to init. ', err);
      if (err.data.msg) {
        this.setState({ userError: err.data.msg, backendError: undefined });
        return;
      }
      let msg = 'failed to initialize with provided Admin API Key';
      if (err.statusText) {
        msg = `${err.status}: ${err.statusText}`;
      }
      this.setState({ backendError: msg, userError: undefined });
    });
    if (!info) {
      console.log('info not returned from registerInit');
      return;
    }
    this.setState({
      info,
      logsInstance: info.tenantInfo?.logInstance?.id,
      metricsInstance: info.tenantInfo?.metricInstance?.id,
      apiHost,
      adminApiToken,
      userError: undefined,
      backendError: undefined,
    });
  };

  onSelectLogs = (id: number) => {
    this.setState({ logsInstance: id });
  };
  onSelectMetrics = (id: number) => {
    this.setState({ metricsInstance: id });
  };

  createDataSource = async (name: string, hosted: HostedInstance) => {
    const { instance } = this.props;
    const { adminApiToken } = this.state;
    try {
      const token = await instance.getViewerToken(adminApiToken!, hosted!);
      if (token) {
        return await createHostedInstance(name, hosted!, token);
      }
      console.error('error getting token');
      return undefined;
    } catch (ex) {
      console.log('Error creating', name, hosted, ex);
    }
    return undefined;
  };

  onSave = async () => {
    const { instance } = this.props;
    const { info, adminApiToken, apiHost } = this.state;
    const name = instance?.instanceSettings.name;

    const hostedMetrics = info?.instances.find(i => i.id === this.state.metricsInstance);
    const hostedLogs = info?.instances.find(i => i.id === this.state.logsInstance);

    if (!hostedMetrics) {
      alert('Missing metrics instance');
      return;
    }

    if (!hostedLogs) {
      alert('Missing logs instance');
      return;
    }

    if (!apiHost) {
      alert('Missing apiHost');
      return;
    }

    const known = await getHostedLokiAndPrometheusInfo();

    let metrics = findHostedInstance(known, hostedMetrics);
    if (!metrics) {
      metrics = await this.createDataSource(`${name} Metrics`, hostedMetrics!);
    }

    let logs = findHostedInstance(known, hostedLogs);
    if (!logs) {
      logs = await this.createDataSource(`${name} Logs`, hostedLogs!);
    }

    const options: SMOptions = {
      apiHost: apiHost,
      logs: {
        grafanaName: logs!.name,
        hostedId: hostedLogs.id,
      },
      metrics: {
        grafanaName: metrics!.name,
        hostedId: hostedMetrics.id,
      },
      dashboards: [],
    };

    // Save the dashboard names
    for (const json of dashboardPaths) {
      const d = await importDashboard(json, options);
      options.dashboards.push(d);
    }
    await instance!.registerSave(adminApiToken!, options, info?.accessToken!);

    // force reload so that GrafanaBootConfig is updated.
    window.location.reload();
  };

  renderSetup() {
    const { info, logsInstance, metricsInstance, backendError, userError } = this.state;

    if (!info) {
      return <TenantAPISetupForm onSubmit={this.onInit} submissionError={userError || backendError} />;
    }
    return (
      <div>
        <div>Select the Grafana Cloud instances Synthetic Monitoring will send data to</div>

        <h4>Metrics</h4>
        <InstanceList
          instances={info.instances.filter(f => f.type === 'prometheus')}
          onSelected={this.onSelectMetrics}
          selected={metricsInstance!}
        />

        <h4>Logs</h4>
        <InstanceList
          instances={info.instances.filter(f => f.type === 'logs')}
          onSelected={this.onSelectLogs}
          selected={logsInstance!}
        />
        <br />
        <br />
        <Button variant="primary" onClick={this.onSave}>
          Setup
        </Button>
      </div>
    );
  }

  showResetModal = (show: boolean) => () => {
    this.setState({ showResetModal: show });
  };

  onReset = () => {
    this.setState({ resetConfig: true });
  };

  onOptionsChange = (options: SMOptions) => {
    const { instance } = this.props;
    return instance.onOptionsChange(options);
  };

  render() {
    const { instance } = this.props;
    if (!instance) {
      return <div>Loading...</div>;
    }
    const { showResetModal, resetConfig } = this.state;

    if (!isValid(instance.instanceSettings?.jsonData) || resetConfig) {
      return this.renderSetup();
    }

    return (
      <div>
        <DashboardList
          options={instance.instanceSettings.jsonData}
          checkUpdates={true}
          onChange={this.onOptionsChange}
        />
        <br />
        <TenantView settings={instance.instanceSettings.jsonData} />
        <Button variant="destructive" onClick={this.showResetModal(true)}>
          Reset
        </Button>
        <ConfirmModal
          isOpen={showResetModal}
          title="Reset Configuration"
          body="Are you sure you want to reset the configuration?"
          confirmText="Reset Configuration"
          onConfirm={this.onReset}
          onDismiss={this.showResetModal(false)}
        />
      </div>
    );
  }
}
