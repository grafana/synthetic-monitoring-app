import React, { PureComponent, ChangeEvent } from 'react';
import { Label, Button, Input } from '@grafana/ui';
import { InitResponse } from 'types';
import { WorldPingDataSource } from 'datasource/DataSource';
import { isValid } from 'datasource/ConfigEditor';
import { InstanceList } from './InstanceList';
import { createHostedInstance } from 'utils';
import { WorldpingOptions } from 'datasource/types';
import { getLocationSrv } from '@grafana/runtime';
import { TenantView } from './TenantView';

interface Props {
  instance: WorldPingDataSource;
}

interface State {
  adminApiToken?: string;
  info?: InitResponse;
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
      logsInstance: info.logInstances[0].id,
      metricsInstance: info.metricInstances[0].id,
    });
  };

  onApiTokenChange = (event: ChangeEvent<any>) => {
    this.setState({ adminApiToken: event.target.value });
  };

  onSelectLogs(id: number) {
    this.setState({ logsInstance: id });
  }
  onSelectMetrics(id: number) {
    this.setState({ metricsInstance: id });
  }

  onSave = async () => {
    const { instance } = this.props;
    const { info, adminApiToken } = this.state;
    const metricsInstance = info?.metricInstances.find(i => i.id === this.state.metricsInstance);
    const logsInstance = info?.logInstances.find(i => i.id === this.state.logsInstance);
    const name = instance?.instanceSettings.name;

    if (!metricsInstance) {
      alert('Missing metrics instance');
      return;
    }

    if (!logsInstance) {
      alert('Missing logs instance');
      return;
    }

    const metrics = await createHostedInstance(`${name} Metrics`, metricsInstance, info!.viewerKeys['metrics-viewer']);
    const logs = await createHostedInstance(`${name} Logs`, logsInstance, info!.viewerKeys['logs-viewer']);

    const options: WorldpingOptions = {
      logs: {
        grafanaName: logs.name,
        hostedId: logsInstance.id,
      },
      metrics: {
        grafanaName: metrics.name,
        hostedId: metricsInstance.id,
      },
    };
    await instance!.registerSave(adminApiToken!, options, info?.accessToken!);

    getLocationSrv().update({
      partial: false,
      path: 'plugins/grafana-worldping-app/',
      query: {
        page: 'checks',
        instance: instance.name,
      },
    });
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
        <h4>Setup</h4>
        <div>Connect worldping to your hosted metrics</div>

        <h4>Metrics</h4>
        <InstanceList instances={info.metricInstances} onSelected={this.onSelectMetrics} selected={metricsInstance!} />

        <h4>Logs</h4>
        <InstanceList instances={info.logInstances} onSelected={this.onSelectLogs} selected={logsInstance!} />
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
