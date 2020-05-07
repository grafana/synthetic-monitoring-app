import React, { PureComponent, ChangeEvent } from 'react';
import { Label, Button, Input } from '@grafana/ui';
import { RegistrationInfo, HostedInstance } from 'types';
import { WorldPingDataSource } from 'datasource/DataSource';
import { isValid } from 'datasource/ConfigEditor';
import { InstanceList } from './InstanceList';
import { createHostedInstance, findHostedInstance, getHostedLokiAndPrometheusInfo } from 'utils';
import { WorldpingOptions } from 'datasource/types';
import { TenantView } from './TenantView';

interface Props {
  instance: WorldPingDataSource;
}

interface State {
  adminApiToken?: string;
  info?: RegistrationInfo;
  logsInstance?: number;
  metricsInstance?: number;
}

export class TenantSetup extends PureComponent<Props, State> {
  state: State = {};

  onInit = async () => {
    const { instance } = this.props;
    const { adminApiToken } = this.state;
    if (!adminApiToken) {
      alert('Missing admin key');
      return;
    }

    const info = await instance.registerInit(adminApiToken);
    this.setState({
      info,
      logsInstance: info.tenantInfo?.logInstance?.id,
      metricsInstance: info.tenantInfo?.metricInstance?.id,
    });
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
    const { info, adminApiToken } = this.state;
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
      logs: {
        grafanaName: logs!.name,
        hostedId: hostedLogs.id,
      },
      metrics: {
        grafanaName: metrics!.name,
        hostedId: hostedMetrics.id,
      },
    };

    await instance!.registerSave(adminApiToken!, options, info?.accessToken!);

    // force reload so that GrafanaBootConfig is updated.
    window.location.reload();
  };

  renderSetup() {
    const { info, adminApiToken, logsInstance, metricsInstance } = this.state;

    if (!info) {
      return (
        <div>
          <Label>Admin API Key</Label>

          <Input type="text" placeholder="your org id" value={adminApiToken || ''} onChange={this.onApiTokenChange} />

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

  render() {
    const { instance } = this.props;
    if (!instance) {
      return <div>Loading...</div>;
    }

    if (!isValid(instance.instanceSettings?.jsonData)) {
      return this.renderSetup();
    }

    return (
      <div>
        <TenantView settings={instance.instanceSettings.jsonData} />
      </div>
    );
  }
}
