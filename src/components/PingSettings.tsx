import React, { PureComponent } from 'react';
import { Container, HorizontalGroup, Field, Select, Switch } from '@grafana/ui';
import { Collapse } from 'components/Collapse';
import { SelectableValue } from '@grafana/data';
import { IpVersion, Settings, PingSettings, Label } from 'types';
import { IP_OPTIONS } from './constants';
import { LabelField } from 'components/LabelField';

interface Props {
  settings: Settings;
  labels?: Label[];
  isEditor: boolean;
  onUpdate: (settings: Settings, labels: Label[]) => void;
}

interface State extends PingSettings {
  showAdvanced: boolean;
  settings?: Settings;
  labels: Label[];
}

export class PingSettingsForm extends PureComponent<Props, State> {
  state: State = {
    ipVersion: this.props.settings!.ping?.ipVersion || IpVersion.V4,
    dontFragment: this.props.settings!.ping?.dontFragment || false,
    labels: this.props.labels ?? [],
    showAdvanced: false,
  };

  onUpdate = () => {
    const { settings, labels } = this.state;
    const pingSettings = { settings: { ping: settings } } as Settings;
    this.props.onUpdate(pingSettings, labels);
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

  onLabelsUpdate = (labels: Label[]) => {
    this.setState({ labels }, this.onUpdate);
  };

  render() {
    const { ipVersion, dontFragment, showAdvanced, labels } = this.state;
    const { isEditor } = this.props;

    return (
      <Collapse label="Advanced Options" collapsible={true} onToggle={this.onToggleOptions} isOpen={showAdvanced}>
        <LabelField labels={labels} isEditor={isEditor} onLabelsUpdate={this.onLabelsUpdate} />
        <HorizontalGroup>
          <div>
            <Field label="IP Version" description="The IP protocol of the ICMP request" disabled={!isEditor}>
              <Select value={ipVersion} options={IP_OPTIONS} onChange={this.onIpVersionChange} />
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
    );
  }
}
