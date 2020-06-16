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
  Button,
  Icon,
  VerticalGroup,
} from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { IpVersion, Settings, HttpSettings, HttpMethod, HttpVersion, BasicAuth, TLSConfig, HeaderMatch } from 'types';
import { FormLabel, WorldpingLabelsForm, IpOptions } from './utils';
import { Label as WorldpingLabel } from 'types';

interface Props {
  settings: Settings;
  isEditor: boolean;
  onUpdate: (settings: Settings) => void;
}

interface State extends HttpSettings {
  showAdvanced: boolean;
  showValidation: boolean;
  showAuthentication: boolean;
  showTLS: boolean;
}

export class HttpSettingsForm extends PureComponent<Props, State> {
  state: State = {
    method: this.props.settings.http?.method || HttpMethod.GET,
    body: this.props.settings.http?.body,
    headers: this.props.settings.http?.headers,
    ipVersion: this.props.settings.http?.ipVersion || IpVersion.V4,
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
    cacheBustingQueryParamName: this.props.settings.http?.cacheBustingQueryParamName,

    showAdvanced: false,
    showValidation: false,
    showAuthentication: false,
    showTLS: false,
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

  onBearerTokenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ bearerToken: event.target.value }, this.onUpdate);
  };

  onBasicAuthChange = (basicAuth: BasicAuth | undefined) => {
    this.setState({ basicAuth: basicAuth }, this.onUpdate);
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

  onCacheBustingQueryParamNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ cacheBustingQueryParamName: event.target.value }, this.onUpdate);
  };

  onToggleAdvanced = (isOpen: boolean) => {
    this.setState({ showAdvanced: !this.state.showAdvanced });
  };

  onToggleValidation = (isOpen: boolean) => {
    this.setState({ showValidation: !this.state.showValidation });
  };

  onToggleAuthentication = (isOpen: boolean) => {
    this.setState({ showAuthentication: !this.state.showAuthentication });
  };

  onToggleTLS = (isOpen: boolean) => {
    this.setState({ showTLS: !this.state.showTLS });
  };

  onTLSChange = (tlsConfig: TLSConfig) => {
    this.setState({ tlsConfig: tlsConfig }, this.onUpdate);
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

  onValidStatusCodeChange = (item: Array<SelectableValue<number>>) => {
    let validStatusCodes: number[] = [];
    for (const p of item.values()) {
      if (p.value) {
        validStatusCodes.push(p.value);
      }
    }
    this.setState({ validStatusCodes }, this.onUpdate);
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

  onFailIfHeaderMatchesUpdate = (headerMatches: HeaderMatch[]) => {
    let matches: HeaderMatch[] = [];
    if (!this.state.failIfHeaderMatchesRegexp) {
      matches = headerMatches;
    } else {
      headerMatches.forEach(v => {
        matches.push(v);
      });
    }
    console.log('setting failIfHeaderMatchesRegexp', matches);
    this.setState({ failIfHeaderMatchesRegexp: matches }, this.onUpdate);
  };

  onFailIfHeaderNotMatchesUpdate = (headerMatches: HeaderMatch[]) => {
    let matches: HeaderMatch[] = [];
    if (!this.state.failIfHeaderNotMatchesRegexp) {
      matches = headerMatches;
    } else {
      headerMatches.forEach(v => {
        matches.push(v);
      });
    }
    this.setState({ failIfHeaderNotMatchesRegexp: matches }, this.onUpdate);
  };

  generateValidStatusCodes() {
    let validCodes = [];
    for (let i = 100; i <= 102; i++) {
      validCodes.push({
        label: `${i}`,
        value: i,
      });
    }
    for (let i = 200; i <= 208; i++) {
      validCodes.push({
        label: `${i}`,
        value: i,
      });
    }
    for (let i = 300; i <= 308; i++) {
      validCodes.push({
        label: `${i}`,
        value: i,
      });
    }
    for (let i = 400; i <= 418; i++) {
      validCodes.push({
        label: `${i}`,
        value: i,
      });
    }
    validCodes.push({
      label: '422',
      value: 422,
    });
    validCodes.push({
      label: '426',
      value: 426,
    });
    validCodes.push({
      label: '428',
      value: 428,
    });
    validCodes.push({
      label: '429',
      value: 429,
    });
    validCodes.push({
      label: '431',
      value: 431,
    });
    for (let i = 500; i <= 511; i++) {
      validCodes.push({
        label: `${i}`,
        value: i,
      });
    }
    validCodes.push({
      label: '598',
      value: 598,
    });
    validCodes.push({
      label: '599',
      value: 599,
    });
    return validCodes;
  }

  render() {
    const { state } = this;
    const { isEditor } = this.props;

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
        label: 'HTTP/2',
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
    const validStatusCodes = this.generateValidStatusCodes();

    return (
      <Container>
        <HorizontalGroup>
          <Field
            label={<FormLabel name="Request Method" help="The HTTP method the probe will use" />}
            disabled={!isEditor}
          >
            <Select value={state.method} options={methodOptions} onChange={this.onMethodChange} />
          </Field>
        </HorizontalGroup>
        <Container>
          <Field
            label={<FormLabel name="Request Body" help="The body of the HTTP request used in probe." />}
            disabled={!isEditor}
          >
            <div>
              <TextArea value={state.body} onChange={this.onBodyChange} rows={2} disabled={!isEditor} />
            </div>
          </Field>
        </Container>
        <Container>
          <Field
            label={<FormLabel name="Request Headers" help="The HTTP headers set for the probe.." />}
            disabled={!isEditor}
          >
            <div>
              <WorldpingLabelsForm
                labels={this.headersToLabels()}
                isEditor={isEditor}
                onUpdate={this.onHeadersUpdate}
                type="Header"
              />
            </div>
          </Field>
        </Container>
        <br />
        <Collapse label="TLS Config" collapsible={true} onToggle={this.onToggleTLS} isOpen={state.showTLS}>
          <TLSForm onChange={this.onTLSChange} isEditor={isEditor} tlsConfig={state.tlsConfig} />
        </Collapse>
        <Collapse
          label="Authentication"
          collapsible={true}
          onToggle={this.onToggleAuthentication}
          isOpen={state.showAuthentication}
        >
          <HorizontalGroup>
            <Field
              label={<FormLabel name="Bearer Token" help="The bearer token for the target" />}
              disabled={!isEditor}
            >
              <Input
                type="password"
                placeholder="Bearer Token"
                value={state.bearerToken}
                onChange={this.onBearerTokenChange}
                disabled={!isEditor}
              />
            </Field>
          </HorizontalGroup>
          <BasicAuthForm onChange={this.onBasicAuthChange} basicAuth={state.basicAuth} isEditor={isEditor} />
        </Collapse>
        <Collapse
          label="Validation"
          collapsible={true}
          onToggle={this.onToggleValidation}
          isOpen={state.showValidation}
        >
          <HorizontalGroup>
            <Field
              label={
                <FormLabel name="Valid Status Codes" help="Accepted status codes for this probe. Defaults to 2xx." />
              }
              disabled={!isEditor}
            >
              <MultiSelect
                options={validStatusCodes}
                value={state.validStatusCodes}
                onChange={this.onValidStatusCodeChange}
                disabled={!isEditor}
              />
            </Field>
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

          <Field
            label={<FormLabel name="Fail if body matches regexp" help="Probe fails if response body matches regex" />}
            disabled={!isEditor}
          >
            <VerticalGroup justify="space-between">
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
              <Button onClick={this.addFailIfBodyMatchesRegexp} disabled={!isEditor} variant="secondary" size="sm">
                <Icon name="plus" />
                &nbsp; Add Body Regexp
              </Button>
            </VerticalGroup>
          </Field>
          <Field
            label={
              <FormLabel
                name="Fail if body doesn't match regexp"
                help="Probe fails if response body does not match regex"
              />
            }
            disabled={!isEditor}
          >
            <VerticalGroup justify="space-between">
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
              <Button onClick={this.addFailIfBodyNotMatchesRegexp} disabled={!isEditor} variant="secondary" size="sm">
                <Icon name="plus" />
                &nbsp; Add Body Regexp
              </Button>
            </VerticalGroup>
          </Field>
          <HeaderMatchForm
            headerMatches={state.failIfHeaderMatchesRegexp || []}
            name="Fail if header matches regexp"
            help="Probe fails if response header matches regex. For headers with multiple values, fails if *at least one* matches"
            onChange={this.onFailIfHeaderMatchesUpdate}
            isEditor={isEditor}
          />
          <HeaderMatchForm
            headerMatches={state.failIfHeaderNotMatchesRegexp || []}
            name="Fail if header doesn't match regexp"
            help="Probe fails if response header does not match regex. For headers with multiple values, fails if *none* match."
            onChange={this.onFailIfHeaderNotMatchesUpdate}
            isEditor={isEditor}
          />
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
                label={<FormLabel name="IP Version" help="The IP protocol of the HTTP request" />}
                disabled={!isEditor}
              >
                <Select value={state.ipVersion} options={IpOptions} onChange={this.onIpVersionChange} />
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
          <HorizontalGroup>
            <div>
              <Field
                label={
                  <FormLabel
                    name="Cache busting query parameter name"
                    help="The name of the query parameter used to prevent the server from using a cached response. Each probe will assign a random value to this parameter each time a request is made."
                  />
                }
              >
                <Input
                  type="string"
                  placeholder="cache-bust"
                  value={state.cacheBustingQueryParamName}
                  onChange={this.onCacheBustingQueryParamNameChange}
                  disabled={!isEditor}
                />
              </Field>
            </div>
          </HorizontalGroup>
        </Collapse>
      </Container>
    );
  }
}

interface BasicAuthProps {
  basicAuth?: BasicAuth;
  isEditor: boolean;
  onChange: (basicAuth: BasicAuth | undefined) => void;
}

interface BasicAuthState {
  username: string;
  password: string;
}

export class BasicAuthForm extends PureComponent<BasicAuthProps, BasicAuthState> {
  state = {
    username: this.props.basicAuth?.username || '',
    password: this.props.basicAuth?.password || '',
  };

  onUpdate = () => {
    if (!this.state.username && !this.state.password) {
      this.props.onChange(undefined);
      return;
    }
    const auth = {
      username: this.state.username,
      password: this.state.password,
    };
    this.props.onChange(auth);
  };

  onUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ username: event.target.value }, this.onUpdate);
  };

  onPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ password: event.target.value }, this.onUpdate);
  };

  render() {
    const { username, password } = this.state;
    const { isEditor } = this.props;

    return (
      <HorizontalGroup>
        <Field label={<FormLabel name="Username" help="Basic Authentication username" />} disabled={!isEditor}>
          <Input
            type="text"
            placeholder="username"
            value={username}
            onChange={this.onUsernameChange}
            disabled={!isEditor}
          />
        </Field>
        <Field label={<FormLabel name="Password" help="Basic Authentication password" />} disabled={!isEditor}>
          <Input
            type="password"
            placeholder="password"
            value={password}
            onChange={this.onPasswordChange}
            disabled={!isEditor}
          />
        </Field>
      </HorizontalGroup>
    );
  }
}

interface TLSProps {
  tlsConfig?: TLSConfig;
  isEditor: boolean;
  onChange: (tlsConfig: TLSConfig) => void;
}

interface TLSState {
  insecureSkipVerify: boolean;
  caCert: string;
  clientCert: string;
  clientKey: string;
  serverName: string;
}

export class TLSForm extends PureComponent<TLSProps, TLSState> {
  state = {
    insecureSkipVerify: this.props.tlsConfig?.insecureSkipVerify || false,
    caCert: this.props.tlsConfig?.caCert || '',
    clientCert: this.props.tlsConfig?.clientCert || '',
    clientKey: this.props.tlsConfig?.clientKey || '',
    serverName: this.props.tlsConfig?.serverName || '',
  };

  onUpdate = () => {
    const cfg = {
      insecureSkipVerify: this.state.insecureSkipVerify,
      caCert: this.state.caCert,
      clientCert: this.state.clientCert,
      clientKey: this.state.clientKey,
      serverName: this.state.serverName,
    };
    this.props.onChange(cfg);
  };

  onInsecureSkipVerifyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ insecureSkipVerify: !this.state.insecureSkipVerify }, this.onUpdate);
  };

  onServerNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ serverName: event.target.value }, this.onUpdate);
  };

  onCACertChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ caCert: event.target.value }, this.onUpdate);
  };
  onClientCertChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ clientCert: event.target.value }, this.onUpdate);
  };
  onClientKeyChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ clientKey: event.target.value }, this.onUpdate);
  };

  render() {
    const { insecureSkipVerify, caCert, clientCert, clientKey, serverName } = this.state;
    const { isEditor } = this.props;

    return (
      <div>
        <HorizontalGroup>
          <Field
            label={<FormLabel name="Skip Validation" help="Disable target certificate validation" />}
            disabled={!isEditor}
          >
            <Container padding="sm">
              <Switch value={insecureSkipVerify} onChange={this.onInsecureSkipVerifyChange} disabled={!isEditor} />
            </Container>
          </Field>
          <Field
            label={<FormLabel name="Server Name" help="Used to verify the hostname for the targets" />}
            disabled={!isEditor}
          >
            <Input
              type="text"
              placeholder="ServerName"
              value={serverName}
              onChange={this.onServerNameChange}
              disabled={!isEditor}
            />
          </Field>
        </HorizontalGroup>
        <Container>
          <Field
            label={<FormLabel name="CA Certificate" help="The CA cert to use for the targets" />}
            disabled={!isEditor}
          >
            <div>
              <TextArea
                value={caCert}
                onChange={this.onCACertChange}
                rows={2}
                disabled={!isEditor}
                placeholder="CA Certificate"
              />
            </div>
          </Field>
        </Container>
        <Container>
          <Field
            label={<FormLabel name="Client Certificate" help="The client cert file for the targets" />}
            disabled={!isEditor}
          >
            <div>
              <TextArea
                value={clientCert}
                onChange={this.onClientCertChange}
                rows={2}
                disabled={!isEditor}
                placeholder="Client Certificate"
              />
            </div>
          </Field>
        </Container>
        <Container>
          <Field
            label={<FormLabel name="Client Key" help="The client key file for the targets" />}
            disabled={!isEditor}
          >
            <div>
              <TextArea
                type="password"
                value={clientKey}
                onChange={this.onClientKeyChange}
                rows={2}
                disabled={!isEditor}
                placeholder="Client Key"
              />
            </div>
          </Field>
        </Container>
      </div>
    );
  }
}

interface HeaderMatchProps {
  headerMatches: HeaderMatch[];
  name: string;
  help: string;
  isEditor: boolean;
  onChange: (headerMatches: HeaderMatch[]) => void;
}

interface HeaderMatchState {
  headerMatches: HeaderMatch[];
}

export class HeaderMatchForm extends PureComponent<HeaderMatchProps, HeaderMatchState> {
  state = {
    headerMatches: this.props.headerMatches,
  };

  onUpdate = () => {
    this.props.onChange(this.state.headerMatches);
  };

  onHeaderChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    let matches: HeaderMatch[] = [];
    this.state.headerMatches.forEach((v, i) => {
      if (i === index) {
        matches.push({
          header: event.target.value,
          regexp: v.regexp,
          allowMissing: v.allowMissing,
        });
      } else {
        matches.push(v);
      }
    });
    this.setState({ headerMatches: matches }, this.onUpdate);
  };

  onRegexpChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    let matches: HeaderMatch[] = [];
    this.state.headerMatches.forEach((v, i) => {
      if (i === index) {
        matches.push({
          header: v.header,
          regexp: event.target.value,
          allowMissing: v.allowMissing,
        });
      } else {
        matches.push(v);
      }
    });
    this.setState({ headerMatches: matches }, this.onUpdate);
  };

  onAllowMissingChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    let matches: HeaderMatch[] = [];
    this.state.headerMatches.forEach((v, i) => {
      if (i === index) {
        matches.push({
          header: v.header,
          regexp: v.regexp,
          allowMissing: !v.allowMissing,
        });
      } else {
        matches.push(v);
      }
    });
    this.setState({ headerMatches: matches }, this.onUpdate);
  };

  onHeaderMatchesDelete = (index: number) => () => {
    let matches: HeaderMatch[] = [];
    this.state.headerMatches?.forEach((v, i) => {
      if (i !== index) {
        matches.push(v);
      }
    });
    this.setState({ headerMatches: matches }, this.onUpdate);
  };

  onHeaderMatchesAdd = () => {
    let matches: HeaderMatch[] = [];
    this.state.headerMatches.forEach(v => {
      matches.push(v);
    });
    matches.push({
      header: '',
      regexp: '',
      allowMissing: false,
    });
    this.setState({ headerMatches: matches }, this.onUpdate);
  };

  render() {
    const { headerMatches } = this.state;
    const { isEditor, name, help } = this.props;

    return (
      <Field label={<FormLabel name={name} help={help} />} disabled={!isEditor}>
        <VerticalGroup justify="space-between">
          <List
            items={headerMatches}
            renderItem={(item, index) => (
              <HorizontalGroup>
                <Input
                  type="text"
                  placeholder="header"
                  value={item.header}
                  onChange={this.onHeaderChange(index)}
                  disabled={!isEditor}
                />
                <Input
                  type="text"
                  placeholder="regexp"
                  value={item.regexp}
                  onChange={this.onRegexpChange(index)}
                  disabled={!isEditor}
                />
                <HorizontalGroup>
                  <span>Allow Missing</span>
                  <Container padding="sm">
                    <Switch
                      title="Allow Missing"
                      value={item.allowMissing}
                      onChange={this.onAllowMissingChange(index)}
                      disabled={!isEditor}
                    />
                  </Container>
                </HorizontalGroup>
                <IconButton name="minus-circle" onClick={this.onHeaderMatchesDelete(index)} disabled={!isEditor} />
              </HorizontalGroup>
            )}
          />
          <Button onClick={this.onHeaderMatchesAdd} disabled={!isEditor} variant="secondary" size="sm">
            <Icon name="plus" />
            &nbsp; Add Header Regexp
          </Button>
        </VerticalGroup>
      </Field>
    );
  }
}
