import React, { PureComponent } from 'react';
import { Collapse, HorizontalGroup, Label, Input, Select, Switch } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { IpVersion, Settings } from 'types';

interface Props {
  settings: Settings;
  onUpdate: (settings: Settings) => void;
}

interface State {
  hostname: string;
  ipVersion: IpVersion;
  dontFragment: boolean;
  collapseOptions: boolean;
}

export class PingSettingsForm extends PureComponent<Props, State> {
  state: State = {
    hostname: this.props.settings!.ping?.hostname || '',
    ipVersion: this.props.settings!.ping?.ipVersion || IpVersion.Any,
    dontFragment: this.props.settings!.ping?.dontFragment || false,
    collapseOptions: false,
  };

  onUpdate = () => {
    const settings = {
      ping: {
        hostname: this.state.hostname,
        ipVersion: this.state.ipVersion,
        dontFragment: this.state.dontFragment,
      },
    };
    this.props.onUpdate(settings);
  };

  onHostnameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ hostname: event.target.value }, this.onUpdate);
  };

  onIpVersionChange = (value: SelectableValue<IpVersion>) => {
    this.setState({ ipVersion: value.value || IpVersion.Any }, this.onUpdate);
  };

  onDontFragmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ dontFragment: !this.state.dontFragment }, this.onUpdate);
  };

  onToggleOptions = (isOpen: boolean) => {
    this.setState({ collapseOptions: !this.state.collapseOptions });
  };

  render() {
    const { hostname, ipVersion, dontFragment, collapseOptions } = this.state;
    const options = [
      {
        label: 'Any',
        value: IpVersion.Any,
      },
      {
        label: 'V4',
        value: IpVersion.V4,
      },
      {
        label: 'V6',
        value: IpVersion.V6,
      },
    ];
    return (
      <div>
        <HorizontalGroup>
          <Label>Endpoint</Label>
          <Input type="string" value={hostname} />
        </HorizontalGroup>
        <Collapse label="Options" collapsible={true} onToggle={this.onToggleOptions} isOpen={collapseOptions}>
          <HorizontalGroup>
            <Label>IP Version</Label>
            <Select value={ipVersion} options={options} onChange={this.onIpVersionChange} />
            <Label>Don't Fragment</Label>
            <Switch value={dontFragment} onChange={this.onDontFragmentChange} />
          </HorizontalGroup>
        </Collapse>
      </div>
    );
  }
}
