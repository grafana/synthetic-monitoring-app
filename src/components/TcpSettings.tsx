import React, { PureComponent } from 'react';
import {
  Collapse,
  Container,
  HorizontalGroup,
  Field,
  Select,
  IconButton,
  List,
  Input,
  Switch,
  TextArea,
} from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { IpVersion, Settings, TcpSettings, TLSConfig, TCPQueryResponse } from 'types';
import { FormLabel, IpOptions } from './utils';
import { TLSForm } from './http/HttpSettings';

interface Props {
  settings: Settings;
  isEditor: boolean;
  onUpdate: (settings: Settings) => void;
}

interface State extends TcpSettings {
  showQueryResponse: boolean;
  showAdvanced: boolean;
  showTLS: boolean;
}
/*
ipVersion: IpVersion;
tls: boolean;
tlsConfig?: TLSConfig;
queryResponse?: TCPQueryResponse[];
*/
export class TcpSettingsForm extends PureComponent<Props, State> {
  state: State = {
    ipVersion: this.props.settings!.tcp?.ipVersion || IpVersion.V4,
    tls: this.props.settings!.tcp?.tls || false,
    tlsConfig: this.props.settings!.tcp?.tlsConfig,
    queryResponse: this.props.settings!.tcp?.queryResponse,
    showQueryResponse: false,
    showAdvanced: false,
    showTLS: false,
  };

  onUpdate = () => {
    const settings = this.state as TcpSettings;
    this.props.onUpdate({
      tcp: settings,
    });
  };

  onIpVersionChange = (value: SelectableValue<IpVersion>) => {
    this.setState({ ipVersion: value.value || IpVersion.Any }, this.onUpdate);
  };

  onToggleTLS = (isOpen: boolean) => {
    this.setState({ showTLS: !this.state.showTLS }, this.onUpdate);
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
    const { ipVersion, tls, showTLS, showQueryResponse, showAdvanced, tlsConfig, queryResponse } = this.state;
    const { isEditor } = this.props;

    return (
      <Container>
        <Field
          label={
            <FormLabel name="Use TLS" description="Whether or not TLS is used when the connection is initiated." />
          }
          disabled={!isEditor}
        >
          <Container padding="sm">
            <Switch title="Use TLS" value={tls} onChange={this.onTLSChange} disabled={!isEditor} />
          </Container>
        </Field>
        <Collapse
          label="Query/Response"
          collapsible={true}
          onToggle={this.onShowQueryResponse}
          isOpen={showQueryResponse}
        >
          <Container>
            <QueryResponseForm
              queryResponses={queryResponse}
              isEditor={isEditor}
              onChange={this.onQueryResponsesUpdate}
            />
          </Container>
        </Collapse>
        <Collapse label="TLS Config" collapsible={true} onToggle={this.onToggleTLS} isOpen={showTLS}>
          <TLSForm onChange={this.onTLSCOnfigChange} isEditor={isEditor} tlsConfig={tlsConfig} />
        </Collapse>
        <Collapse label="Advanced Options" collapsible={true} onToggle={this.onShowAdvanced} isOpen={showAdvanced}>
          <HorizontalGroup>
            <div>
              <Field
                label={<FormLabel name="IP Version" description="The IP protocol of the ICMP request" />}
                disabled={!isEditor}
              >
                <Select value={ipVersion} options={IpOptions} onChange={this.onIpVersionChange} />
              </Field>
            </div>
          </HorizontalGroup>
        </Collapse>
      </Container>
    );
  }
}

interface RawQueryResponse {
  send: string;
  expect: string;
  startTLS: boolean;
}

interface QueryResponseProps {
  queryResponses?: TCPQueryResponse[];
  isEditor: boolean;
  onChange: (queryResponses: TCPQueryResponse[]) => void;
}

interface QueryResponseState {
  queryResponses: RawQueryResponse[];
}

export class QueryResponseForm extends PureComponent<QueryResponseProps, QueryResponseState> {
  state = {
    queryResponses: (this.props.queryResponses || []).map(v => {
      return {
        expect: atob(v.expect),
        send: atob(v.send),
        startTLS: v.startTLS,
      };
    }),
  };

  onUpdate = () => {
    let queryResponses: TCPQueryResponse[] = [];
    this.state.queryResponses.forEach(v => {
      queryResponses.push({
        expect: btoa(v.expect),
        send: btoa(v.send),
        startTLS: v.startTLS,
      });
    });
    this.props.onChange(queryResponses);
  };

  onSendChange = (index: number) => (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    let queryResponses: TCPQueryResponse[] = [];
    this.state.queryResponses.forEach((v, i) => {
      if (i === index) {
        queryResponses.push({
          send: event.target.value,
          expect: v.expect,
          startTLS: v.startTLS,
        });
      } else {
        queryResponses.push(v);
      }
    });
    this.setState({ queryResponses }, this.onUpdate);
  };

  onExpectChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    let queryResponses: TCPQueryResponse[] = [];
    this.state.queryResponses.forEach((v, i) => {
      if (i === index) {
        queryResponses.push({
          send: v.send,
          expect: event.target.value,
          startTLS: v.startTLS,
        });
      } else {
        queryResponses.push(v);
      }
    });
    this.setState({ queryResponses }, this.onUpdate);
  };

  onStartTLSChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    let queryResponses: TCPQueryResponse[] = [];
    this.state.queryResponses.forEach((v, i) => {
      if (i === index) {
        queryResponses.push({
          send: v.send,
          expect: v.expect,
          startTLS: !v.startTLS,
        });
      } else {
        queryResponses.push(v);
      }
    });
    this.setState({ queryResponses }, this.onUpdate);
  };

  onQueryResponseDelete = (index: number) => () => {
    let queryResponses: TCPQueryResponse[] = [];
    this.state.queryResponses.forEach((v, i) => {
      if (i !== index) {
        queryResponses.push(v);
      }
    });
    this.setState({ queryResponses }, this.onUpdate);
  };

  onQueryResponseAdd = () => {
    let queryResponses: TCPQueryResponse[] = [];
    this.state.queryResponses.forEach(v => {
      queryResponses.push(v);
    });
    queryResponses.push({
      send: '',
      expect: '',
      startTLS: false,
    });
    this.setState({ queryResponses }, this.onUpdate);
  };

  render() {
    const { queryResponses } = this.state;
    const { isEditor } = this.props;

    return (
      <Field
        label={
          <FormLabel
            name="Query/Response"
            description="The query sent in the TCP probe and the expected associated response. StartTLS upgrades TCP connection to TLS."
          />
        }
        disabled={!isEditor}
      >
        <Container>
          <List
            items={queryResponses}
            renderItem={(item, index) => (
              <HorizontalGroup>
                <Input
                  type="text"
                  placeholder="response to expect"
                  value={item.expect}
                  onChange={this.onExpectChange(index)}
                  disabled={!isEditor}
                />
                <TextArea
                  type="text"
                  placeholder="data to send"
                  rows={1}
                  value={item.send}
                  onChange={this.onSendChange(index)}
                  disabled={!isEditor}
                />
                <HorizontalGroup>
                  <span>StartTLS</span>
                  <Container padding="sm">
                    <Switch
                      title="StartTLS"
                      value={item.startTLS}
                      onChange={this.onStartTLSChange(index)}
                      disabled={!isEditor}
                    />
                  </Container>
                </HorizontalGroup>
                <IconButton name="minus-circle" onClick={this.onQueryResponseDelete(index)} disabled={!isEditor} />
              </HorizontalGroup>
            )}
          />
          <IconButton name="plus-circle" onClick={this.onQueryResponseAdd} disabled={!isEditor} />
        </Container>
      </Field>
    );
  }
}
