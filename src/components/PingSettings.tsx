import React, { PureComponent } from 'react';
import { Collapse, Container, HorizontalGroup, Field, Select, Switch } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { IpVersion, Settings, PingSettings } from 'types';
import { IpOptions } from './utils';

interface Props {
  settings: Settings;
  isEditor: boolean;
  onUpdate: (settings: Settings) => void;
}

interface State extends PingSettings {
  showAdvanced: boolean;
}

export class PingSettingsForm extends PureComponent<Props, State> {
  state: State = {
    ipVersion: this.props.settings!.ping?.ipVersion || IpVersion.V4,
    dontFragment: this.props.settings!.ping?.dontFragment || false,
    showAdvanced: false,
  };

  onUpdate = () => {
    const settings = this.state as PingSettings;
    this.props.onUpdate({
      ping: settings,
    });
  };

  onIpVersionChange = (value: SelectableValue<IpVersion>) => {
    this.setState({ ipVersion: value.value || IpVersion.Any }, this.onUpdate);
  };

  onDontFragmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ dontFragment: !this.state.dontFragment }, this.onUpdate);
  };

  onToggleOptions = (isOpen: boolean) => {
    this.setState({ showAdvanced: !this.state.showAdvanced });
  };

  render() {
    const { ipVersion, dontFragment, showAdvanced } = this.state;
    const { isEditor } = this.props;

    return (
      <Container>
        <Collapse label="Advanced Options" collapsible={true} onToggle={this.onToggleOptions} isOpen={showAdvanced}>
          <HorizontalGroup>
            <div>
              <Field label="IP Version" description="The IP protocol of the ICMP request" disabled={!isEditor}>
                <Select value={ipVersion} options={IpOptions} onChange={this.onIpVersionChange} />
              </Field>
            </div>
            <div>
              <Field
                label="Don't Fragment"
                description="Set the DF-bit in the IP-header. Only works with ipV4"
                disabled={!isEditor}
              >
                <Container padding="sm">
                  <Switch value={dontFragment} onChange={this.onDontFragmentChange} disabled={!isEditor} />
                </Container>
              </Field>
            </div>
          </HorizontalGroup>
        </Collapse>
      </Container>
    );
  }
}
