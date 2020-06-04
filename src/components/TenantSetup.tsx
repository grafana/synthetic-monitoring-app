import React, { PureComponent, ChangeEvent } from 'react';
import { Label, Button, Input, ConfirmModal, HorizontalGroup, Collapse } from '@grafana/ui';
import { RegistrationInfo, HostedInstance } from 'types';
import { WorldPingDataSource } from 'datasource/DataSource';
import { isValid } from 'datasource/ConfigEditor';
import { InstanceList } from './InstanceList';
import { createHostedInstance, findHostedInstance, getHostedLokiAndPrometheusInfo } from 'utils';
import { WorldpingOptions } from 'datasource/types';
import { TenantView } from './TenantView';
import { dashboardPaths, importDashboard } from 'dashboards/loader';
import { DashboardList } from './DashboardList';

interface Props {
  instance: WorldPingDataSource;
}

interface State {
  showAdvanced: boolean;
  apiHost?: string;
  adminApiToken?: string;
  info?: RegistrationInfo;
  logsInstance?: number;
  metricsInstance?: number;
  showResetModal: boolean;
  resetConfig: boolean;
}

export class TenantSetup extends PureComponent<Props, State> {
  defaultApiHost = 'https://worldping-api-dev.grafana.net';

  state: State = {
    showResetModal: false,
    resetConfig: false,
    apiHost: this.defaultApiHost,
    showAdvanced: false,
  };

  onInit = async () => {
    const { instance } = this.props;
    const { adminApiToken, apiHost } = this.state;
    if (!adminApiToken) {
      alert('Missing admin key');
      return;
    }
    if (!apiHost) {
      alert('Missing apiHost');
      return;
    }

    const info = await instance.registerInit(apiHost, adminApiToken);
    this.setState({
      info,
      logsInstance: info.tenantInfo?.logInstance?.id,
      metricsInstance: info.tenantInfo?.metricInstance?.id,
    });
  };

  onApiHostChange = (event: ChangeEvent<any>) => {
    this.setState({ apiHost: event.target.value });
  };

  onApiTokenChange = (event: ChangeEvent<any>) => {
    this.setState({ adminApiToken: event.target.value });
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

    const options: WorldpingOptions = {
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

  onToggleAdvanced = (isOpen: boolean) => {
    this.setState({ showAdvanced: !this.state.showAdvanced });
  };

  renderSetup() {
    const { info, adminApiToken, apiHost, logsInstance, metricsInstance, showAdvanced } = this.state;

    if (!info) {
      return (
        <div>
          <HorizontalGroup wrap={true}>
            <Label>Admin API Key</Label>

            <Input
              type="text"
              width={100}
              placeholder="Grafana.com Admin Api Key"
              value={adminApiToken || ''}
              onChange={this.onApiTokenChange}
            />
          </HorizontalGroup>
          <br />
          <Collapse label="Advanced" collapsible={true} onToggle={this.onToggleAdvanced} isOpen={showAdvanced}>
            <HorizontalGroup>
              <Label>Backend Address</Label>

              <Input
                type="text"
                width={40}
                placeholder="worldPing backend Address"
                value={apiHost || this.defaultApiHost}
                onChange={this.onApiHostChange}
              />
            </HorizontalGroup>
          </Collapse>
          <Button variant="primary" onClick={this.onInit}>
            Initalize
          </Button>
        </div>
      );
    }
    return (
      <div>
        <div>Select the hosted instances where worldping will send it data</div>

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

  onOptionsChange = (options: WorldpingOptions) => {
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
          body="Are you sure you want to reset worldPing's configuration?"
          confirmText="Reset Configuration"
          onConfirm={this.onReset}
          onDismiss={this.showResetModal(false)}
        />
      </div>
    );
  }
}
