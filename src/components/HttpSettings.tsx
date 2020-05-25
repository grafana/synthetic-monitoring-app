import React, { PureComponent } from 'react';
import {
  Collapse,
  Container,
  HorizontalGroup,
  Field,
  Select,
  Switch,
  MultiSelect,
  TextArea,
  List,
  IconButton,
  Input,
} from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { IpVersion, Settings, HttpSettings, HttpMethod, HttpVersion } from 'types';
import { FormLabel, WorldpingLabelsForm } from './utils';
import { Label as WorldpingLabel } from 'types';

interface Props {
  settings: Settings;
  isEditor: boolean;
  onUpdate: (settings: Settings) => void;
}

interface State extends HttpSettings {
  showAdvanced: boolean;
  showValidation: boolean;
}

export class HttpSettingsForm extends PureComponent<Props, State> {
  state: State = {
    method: this.props.settings.http?.method || HttpMethod.GET,
    body: this.props.settings.http?.body,
    headers: this.props.settings.http?.headers,
    ipVersion: this.props.settings.http?.ipVersion || IpVersion.Any,
    noFollowRedirects: this.props.settings.http?.noFollowRedirects || false,

    // validations
    failIfSSL: this.props.settings.http?.failIfSSL || false,
    failIfNotSSL: this.props.settings.http?.failIfNotSSL || false,
    validStatusCodes: this.props.settings.http?.validStatusCodes || [],
    validHTTPVersions: this.props.settings.http?.validHTTPVersions || [],
    failIfBodyMatchesRegexp: this.props.settings.http?.failIfBodyMatchesRegexp || [],
    failIfBodyNotMatchesRegexp: this.props.settings.http?.failIfBodyNotMatchesRegexp || [],
    failIfHeaderMatchesRegexp: this.props.settings.http?.failIfHeaderMatchesRegexp || [],
    failIfHeaderNotMatchesRegexp: this.props.settings.http?.failIfHeaderNotMatchesRegexp || [],

    showAdvanced: false,
    showValidation: false,
  };

  onUpdate = () => {
    const settings = this.state as HttpSettings;
    this.props.onUpdate({
      http: settings,
    });
  };

  onMethodChange = (value: SelectableValue<HttpMethod>) => {
    this.setState({ method: value.value || HttpMethod.GET }, this.onUpdate);
  };

  onBodyChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ body: event.target.value }, this.onUpdate);
  };

  onIpVersionChange = (value: SelectableValue<IpVersion>) => {
    this.setState({ ipVersion: value.value || IpVersion.Any }, this.onUpdate);
  };

  onNoFollowRedirectsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ noFollowRedirects: !this.state.noFollowRedirects }, this.onUpdate);
  };

  onFailIfNotSSLChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ failIfNotSSL: !this.state.failIfNotSSL }, this.onUpdate);
  };

  onFailIfSSLChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ failIfSSL: !this.state.failIfSSL }, this.onUpdate);
  };

  onToggleAdvanced = (isOpen: boolean) => {
    this.setState({ showAdvanced: !this.state.showAdvanced });
  };

  onToggleValidation = (isOpen: boolean) => {
    this.setState({ showValidation: !this.state.showValidation });
  };

  onValidHttpVersionsChange = (item: Array<SelectableValue<HttpVersion>>) => {
    let validHTTPVersions: HttpVersion[] = [];
    for (const p of item.values()) {
      if (p.value) {
        validHTTPVersions.push(p.value);
      }
    }
    this.setState({ validHTTPVersions }, this.onUpdate);
  };

  headersToLabels(): WorldpingLabel[] {
    let labels: WorldpingLabel[] = [];
    for (const h of this.state.headers || []) {
      const parts = h.split(':', 2);
      labels.push({
        name: parts[0],
        value: parts[1],
      });
    }
    return labels;
  }

  onHeadersUpdate = (labels: WorldpingLabel[]) => {
    let headers: string[] = [];
    for (const l of labels) {
      headers.push(`${l.name}: ${l.value}`);
    }
    this.setState({ headers }, this.onUpdate);
  };

  onFailIfBodyMatchesRegexpChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    let failIfBodyMatchesRegexp: string[] = [];
    this.state.failIfBodyMatchesRegexp?.forEach((v, i) => {
      if (i === index) {
        failIfBodyMatchesRegexp.push(event.target.value);
      } else {
        failIfBodyMatchesRegexp.push(v);
      }
    });
    this.setState({ failIfBodyMatchesRegexp }, this.onUpdate);
  };

  onFailIfBodyMatchesRegexpDelete = (index: number) => () => {
    let failIfBodyMatchesRegexp: string[] = [];
    this.state.failIfBodyMatchesRegexp?.forEach((v, i) => {
      if (i !== index) {
        failIfBodyMatchesRegexp.push(v);
      }
    });
    this.setState({ failIfBodyMatchesRegexp }, this.onUpdate);
  };

  addFailIfBodyMatchesRegexp = () => {
    let failIfBodyMatchesRegexp: string[] = [];
    for (const v of this.state.failIfBodyMatchesRegexp || []) {
      failIfBodyMatchesRegexp.push(v);
    }
    failIfBodyMatchesRegexp.push('');
    this.setState({ failIfBodyMatchesRegexp }, this.onUpdate);
  };

  onFailIfBodyNotMatchesRegexpChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    let failIfBodyNotMatchesRegexp: string[] = [];
    this.state.failIfBodyNotMatchesRegexp?.forEach((v, i) => {
      if (i === index) {
        failIfBodyNotMatchesRegexp.push(event.target.value);
      } else {
        failIfBodyNotMatchesRegexp.push(v);
      }
    });
    this.setState({ failIfBodyNotMatchesRegexp }, this.onUpdate);
  };

  onFailIfBodyNotMatchesRegexpDelete = (index: number) => () => {
    let failIfBodyNotMatchesRegexp: string[] = [];
    this.state.failIfBodyNotMatchesRegexp?.forEach((v, i) => {
      if (i !== index) {
        failIfBodyNotMatchesRegexp.push(v);
      }
    });
    this.setState({ failIfBodyNotMatchesRegexp }, this.onUpdate);
  };

  addFailIfBodyNotMatchesRegexp = () => {
    let failIfBodyNotMatchesRegexp: string[] = [];
    for (const v of this.state.failIfBodyNotMatchesRegexp || []) {
      failIfBodyNotMatchesRegexp.push(v);
    }
    failIfBodyNotMatchesRegexp.push('');
    this.setState({ failIfBodyNotMatchesRegexp }, this.onUpdate);
  };

  render() {
    const { state } = this;
    const { isEditor } = this.props;

    const ipOptions = [
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
    const httpVersionOptions = [
      {
        label: 'HTTP/1.0',
        value: HttpVersion.HTTP1_0,
      },
      {
        label: 'HTTP/1.1',
        value: HttpVersion.HTTP1_1,
      },
      {
        label: 'HTTP/2.0',
        value: HttpVersion.HTTP2_0,
      },
    ];
    const methodOptions = [
      {
        label: 'GET',
        value: HttpMethod.GET,
      },
      {
        label: 'HEAD',
        value: HttpMethod.HEAD,
      },
      {
        label: 'PUT',
        value: HttpMethod.PUT,
      },
      {
        label: 'POST',
        value: HttpMethod.POST,
      },
      {
        label: 'DELETE',
        value: HttpMethod.DELETE,
      },
      {
        label: 'OPTIONS',
        value: HttpMethod.OPTIONS,
      },
    ];
    return (
      <Container>
        <HorizontalGroup>
          <Field label={<FormLabel name="Method" help="The HTTP method the probe will use" />} disabled={!isEditor}>
            <Select value={state.method} options={methodOptions} onChange={this.onMethodChange} />
          </Field>
        </HorizontalGroup>
        <Container>
          <Field
            label={<FormLabel name="Body" help="The body of the HTTP request used in probe." />}
            disabled={!isEditor}
          >
            <div>
              <TextArea value={state.body} onChange={this.onBodyChange} rows={5} disabled={!isEditor} />
            </div>
          </Field>
        </Container>
        <Container>
          <Field label={<FormLabel name="Headers" help="The HTTP headers set for the probe.." />} disabled={!isEditor}>
            <div>
              <WorldpingLabelsForm
                labels={this.headersToLabels()}
                isEditor={isEditor}
                onUpdate={this.onHeadersUpdate}
              />
            </div>
          </Field>
        </Container>
        <br />
        <Collapse
          label="Validation"
          collapsible={true}
          onToggle={this.onToggleValidation}
          isOpen={state.showValidation}
        >
          <HorizontalGroup>
            <Field
              label={<FormLabel name="Valid HTTP Versions" help="Accepted HTTP versions for this probe" />}
              disabled={!isEditor}
            >
              <MultiSelect
                options={httpVersionOptions}
                value={state.validHTTPVersions}
                onChange={this.onValidHttpVersionsChange}
                disabled={!isEditor}
              />
            </Field>
            <Field label={<FormLabel name="Fail if SSL" help="Probe fails if SSL is present" />} disabled={!isEditor}>
              <Container padding="sm">
                <Switch value={state.failIfSSL} onChange={this.onFailIfSSLChange} disabled={!isEditor} />
              </Container>
            </Field>
            <Field
              label={<FormLabel name="Fail if not SSL" help="Probe fails if SSL is not present" />}
              disabled={!isEditor}
            >
              <Container padding="sm">
                <Switch value={state.failIfNotSSL} onChange={this.onFailIfNotSSLChange} disabled={!isEditor} />
              </Container>
            </Field>
          </HorizontalGroup>
          <HorizontalGroup>
            <Field
              label={<FormLabel name="Fail if body matches regexp" help="Probe fails if response body matches regex" />}
              disabled={!isEditor}
            >
              <Container>
                <List
                  items={state.failIfBodyMatchesRegexp || []}
                  renderItem={(item, index) => (
                    <HorizontalGroup>
                      <Input
                        type="text"
                        placeholder="regexp"
                        value={item}
                        onChange={this.onFailIfBodyMatchesRegexpChange(index)}
                        disabled={!isEditor}
                      />
                      <IconButton
                        name="minus-circle"
                        onClick={this.onFailIfBodyMatchesRegexpDelete(index)}
                        disabled={!isEditor}
                      />
                    </HorizontalGroup>
                  )}
                />
                <IconButton name="plus-circle" onClick={this.addFailIfBodyMatchesRegexp} disabled={!isEditor} />
              </Container>
            </Field>
          </HorizontalGroup>
          <HorizontalGroup>
            <Field
              label={
                <FormLabel
                  name="Fail if body doesn't match regexp"
                  help="Probe fails if response body does not match regex"
                />
              }
              disabled={!isEditor}
            >
              <Container>
                <List
                  items={state.failIfBodyNotMatchesRegexp || []}
                  renderItem={(item, index) => (
                    <HorizontalGroup>
                      <Input
                        type="text"
                        placeholder="regexp"
                        value={item}
                        onChange={this.onFailIfBodyNotMatchesRegexpChange(index)}
                        disabled={!isEditor}
                      />
                      <IconButton
                        name="minus-circle"
                        onClick={this.onFailIfBodyNotMatchesRegexpDelete(index)}
                        disabled={!isEditor}
                      />
                    </HorizontalGroup>
                  )}
                />
                <IconButton name="plus-circle" onClick={this.addFailIfBodyNotMatchesRegexp} disabled={!isEditor} />
              </Container>
            </Field>
          </HorizontalGroup>
        </Collapse>
        <Collapse
          label="Advanced Options"
          collapsible={true}
          onToggle={this.onToggleAdvanced}
          isOpen={state.showAdvanced}
        >
          <HorizontalGroup>
            <div>
              <Field
                label={<FormLabel name="IP Version" help="The IP protocol of the ICMP request" />}
                disabled={!isEditor}
              >
                <Select value={state.ipVersion} options={ipOptions} onChange={this.onIpVersionChange} />
              </Field>
            </div>
            <div>
              <Field
                label={<FormLabel name="Follow Redirects" help="Whether or not the probe will follow any redirects." />}
                disabled={!isEditor}
              >
                <Container padding="sm">
                  <Switch
                    value={!state.noFollowRedirects}
                    onChange={this.onNoFollowRedirectsChange}
                    disabled={!isEditor}
                  />
                </Container>
              </Field>
            </div>
          </HorizontalGroup>
        </Collapse>
      </Container>
    );
  }
}
