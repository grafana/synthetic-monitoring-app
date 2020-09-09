import React, { PureComponent } from 'react';
import { Container, HorizontalGroup, Field, Select, Switch } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { IpVersion, Settings, TcpSettings, TLSConfig, TCPQueryResponse, Label, OnUpdateSettingsArgs } from 'types';
import { TLSForm } from 'components/http/HttpSettings';
import QueryResponseForm from './TcpQueryResponseForm';
import { IP_OPTIONS } from '../constants';
import { LabelField } from 'components/LabelField';
import { Collapse } from 'components/Collapse';

interface Props {
  settings: Settings;
  isEditor: boolean;
  labels: Label[];
  onUpdate: (args: OnUpdateSettingsArgs) => void;
}

interface State extends TcpSettings {
  showQueryResponse: boolean;
  showAdvanced: boolean;
  showTLS: boolean;
  showTCPSettings: boolean;
  labels: Label[];
}
/*
ipVersion: IpVersion;
tls: boolean;
tlsConfig?: TLSConfig;
queryResponse?: TCPQueryResponse[];
*/
export default class TcpSettingsForm extends PureComponent<Props, State> {
  state: State = {
    ipVersion: this.props.settings!.tcp?.ipVersion || IpVersion.V4,
    tls: this.props.settings!.tcp?.tls || false,
    tlsConfig: this.props.settings!.tcp?.tlsConfig,
    queryResponse: this.props.settings!.tcp?.queryResponse,
    labels: this.props.labels ?? [],
    showQueryResponse: false,
    showAdvanced: false,
    showTLS: false,
    showTCPSettings: false,
  };

  onUpdate = () => {
    const { ipVersion, tls, tlsConfig, queryResponse, labels } = this.state;
    const settings = {
      ipVersion,
      tls,
      tlsConfig,
      queryResponse,
    };
    this.props.onUpdate({
      settings: {
        tcp: settings,
      },
      labels,
    });
  };

  onIpVersionChange = (value: SelectableValue<IpVersion>) => {
    this.setState({ ipVersion: value.value || IpVersion.Any }, this.onUpdate);
  };

  onToggleTLS = (isOpen: boolean) => {
    this.setState({ showTLS: !this.state.showTLS }, this.onUpdate);
  };

  onToggleTCPSettings = () => {
    this.setState({ showTCPSettings: !this.state.showTCPSettings });
  };

  onTLSChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ tls: !this.state.tls }, this.onUpdate);
  };

  onTLSCOnfigChange = (tlsConfig: TLSConfig) => {
    this.setState({ tlsConfig: tlsConfig }, this.onUpdate);
  };

  onShowAdvanced = (isOpen: boolean) => {
    this.setState({ showAdvanced: !this.state.showAdvanced });
  };

  onShowQueryResponse = (isOpen: boolean) => {
    this.setState({ showQueryResponse: !this.state.showQueryResponse });
  };

  onLabelsChange = (labels: Label[]) => {
    this.setState({ labels }, this.onUpdate);
  };

  onQueryResponsesUpdate = (queryResponse: TCPQueryResponse[]) => {
    let config: TCPQueryResponse[] = [];
    if (!this.state.queryResponse) {
      config = queryResponse;
    } else {
      queryResponse.forEach(v => {
        config.push(v);
      });
    }

    this.setState({ queryResponse: config }, this.onUpdate);
  };

  render() {
    const {
      ipVersion,
      tls,
      showTCPSettings,
      showTLS,
      showQueryResponse,
      showAdvanced,
      tlsConfig,
      queryResponse,
      labels,
    } = this.state;
    const { isEditor } = this.props;

    return (
      <Container>
        <Collapse label="TCP Settings" onToggle={this.onToggleTCPSettings} isOpen={showTCPSettings} collapsible>
          <Field
            label="Use TLS"
            description="Whether or not TLS is used when the connection is initiated."
            disabled={!isEditor}
          >
            <Container padding="sm">
              <Switch title="Use TLS" value={tls} onChange={this.onTLSChange} disabled={!isEditor} />
            </Container>
          </Field>
        </Collapse>
        <Collapse label="Query/Response" onToggle={this.onShowQueryResponse} isOpen={showQueryResponse} collapsible>
          <Container>
            <QueryResponseForm
              queryResponses={queryResponse}
              isEditor={isEditor}
              onChange={this.onQueryResponsesUpdate}
            />
          </Container>
        </Collapse>
        <Collapse label="TLS Config" onToggle={this.onToggleTLS} isOpen={showTLS} collapsible>
          <TLSForm onChange={this.onTLSCOnfigChange} isEditor={isEditor} tlsConfig={tlsConfig} />
        </Collapse>
        <Collapse label="Advanced Options" onToggle={this.onShowAdvanced} isOpen={showAdvanced} collapsible>
          <LabelField isEditor={isEditor} labels={labels} onLabelsUpdate={this.onLabelsChange} />
          <HorizontalGroup>
            <div>
              <Field label="IP Version" description="The IP protocol of the ICMP request" disabled={!isEditor}>
                <Select value={ipVersion} options={IP_OPTIONS} onChange={this.onIpVersionChange} />
              </Field>
            </div>
          </HorizontalGroup>
        </Collapse>
      </Container>
    );
  }
}
