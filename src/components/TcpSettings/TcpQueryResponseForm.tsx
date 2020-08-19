import React, { PureComponent } from 'react';
import { Container, HorizontalGroup, Field, IconButton, List, Input, Switch, TextArea } from '@grafana/ui';
import { TCPQueryResponse } from 'types';

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

export default class QueryResponseForm extends PureComponent<QueryResponseProps, QueryResponseState> {
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
        label="Query/Response"
        description="The query sent in the TCP probe and the expected associated response. StartTLS upgrades TCP connection to TLS."
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
