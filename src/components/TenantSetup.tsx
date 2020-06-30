import React, { PureComponent, ChangeEvent } from 'react';
import { Field, Button, Input, ConfirmModal, HorizontalGroup, Collapse, InfoBox, Alert, Container } from '@grafana/ui';
import { RegistrationInfo, HostedInstance } from 'types';
import { SMDataSource } from 'datasource/DataSource';
import { isValid } from 'datasource/ConfigEditor';
import { InstanceList } from './InstanceList';
import { createHostedInstance, findHostedInstance, getHostedLokiAndPrometheusInfo } from 'utils';
import { SMOptions } from 'datasource/types';
import { TenantView } from './TenantView';
import { dashboardPaths, importDashboard } from 'dashboards/loader';
import { DashboardList } from './DashboardList';

interface Props {
  instance: SMDataSource;
}

interface State {
  showAdvanced: boolean;
  apiHost?: string;
  adminApiToken?: string;
  userError?: string;
  backendError?: string;
  info?: RegistrationInfo;
  logsInstance?: number;
  metricsInstance?: number;
  showResetModal: boolean;
  resetConfig: boolean;
}

export class TenantSetup extends PureComponent<Props, State> {
  defaultApiHost = 'https://synthetic-monitoring-api.grafana.net';

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
      userError: undefined,
      backendError: undefined,
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

  onToggleAdvanced = (isOpen: boolean) => {
    this.setState({ showAdvanced: !this.state.showAdvanced });
  };

  renderSetup() {
    const {
      info,
      adminApiToken,
      apiHost,
      logsInstance,
      metricsInstance,
      showAdvanced,
      userError,
      backendError,
    } = this.state;

    if (!info) {
      return (
        <div>
          <HorizontalGroup wrap={true}>
            <InfoBox
              title="Initialize Synthetic Monitoring App"
              url={'https://grafana.com/grafana/plugins/grafana-synthetic-monitoring-app/'}
            >
              <p>
                To initialize the App and connect it to your Grafana Cloud service you will need a Admin API key for you
                Grafana.com account. The <b>API key</b> is only needed for the initialization process and will not be
                stored. Once the initialization is complete you can safely delete the key.
                <br />
                <br />
                <a className="highlight-word" href="//grafana.com/profile/api-keys" target="_blank">
                  Generate a new API key
                </a>
              </p>
            </InfoBox>
            <Field label="Admin API Key" error={userError} invalid={userError !== undefined}>
              <Input
                type="text"
                width={100}
                placeholder="Grafana.com Admin Api Key"
                value={adminApiToken || ''}
                onChange={this.onApiTokenChange}
              />
            </Field>
          </HorizontalGroup>
          <br />
          <Collapse label="Advanced" collapsible={true} onToggle={this.onToggleAdvanced} isOpen={showAdvanced}>
            <HorizontalGroup>
              <Field label="Backend Address">
                <Input
                  type="text"
                  width={40}
                  placeholder="Synthetic Monitoring Backend Address"
                  value={apiHost || this.defaultApiHost}
                  onChange={this.onApiHostChange}
                />
              </Field>
            </HorizontalGroup>
          </Collapse>
          <Button variant="primary" onClick={this.onInit}>
            Initalize
          </Button>
          {backendError !== undefined && (
            <Container margin="md">
              <Alert title="Backend Error" severity="error">
                {backendError}
              </Alert>
            </Container>
          )}
        </div>
      );
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
