import React, { FC, useState, PureComponent } from 'react';
import {
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
import { css } from 'emotion';
import { useFormContext, Controller } from 'react-hook-form';
import { SelectableValue } from '@grafana/data';
import {
  Label as SMLabel,
  IpVersion,
  Settings,
  HttpSettings,
  HttpMethod,
  HttpVersion,
  BasicAuth,
  TLSConfig,
  HeaderMatch,
  OnUpdateSettingsArgs,
} from 'types';
import { Collapse } from 'components/Collapse';
import SMLabelsForm from 'components/SMLabelsForm';
import { IP_OPTIONS } from '../constants';
import { AuthSettings } from './AuthSettings';
import { LabelField } from 'components/LabelField';

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

const generateValidStatusCodes = () => {
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
};

const validStatusCodes = generateValidStatusCodes();

interface Props {
  settings?: HttpSettings;
  isEditor: boolean;
  labels: SMLabel[];
  onUpdate: (args: OnUpdateSettingsArgs) => void;
}

// interface State extends HttpSettings {
//   showAdvanced: boolean;
//   showValidation: boolean;
//   showAuthentication: boolean;
//   showTLS: boolean;
//   showHTTPSettings: boolean;
//   labels: SMLabel[];
// }

// state: State = {
//   method: this.props.settings.http?.method || HttpMethod.GET,
//   body: this.props.settings.http?.body,
//   headers: this.props.settings.http?.headers,
//   ipVersion: this.props.settings.http?.ipVersion || IpVersion.V4,
//   noFollowRedirects: this.props.settings.http?.noFollowRedirects || false,
//   labels: this.props.labels ?? [],

//   // Authentication
//   bearerToken: this.props.settings.http?.bearerToken,
//   basicAuth: this.props.settings.http?.basicAuth,

//   // validations
//   failIfSSL: this.props.settings.http?.failIfSSL || false,
//   failIfNotSSL: this.props.settings.http?.failIfNotSSL || false,
//   validStatusCodes: this.props.settings.http?.validStatusCodes || [],
//   validHTTPVersions: this.props.settings.http?.validHTTPVersions || [],
//   failIfBodyMatchesRegexp: this.props.settings.http?.failIfBodyMatchesRegexp || [],
//   failIfBodyNotMatchesRegexp: this.props.settings.http?.failIfBodyNotMatchesRegexp || [],
//   failIfHeaderMatchesRegexp: this.props.settings.http?.failIfHeaderMatchesRegexp || [],
//   failIfHeaderNotMatchesRegexp: this.props.settings.http?.failIfHeaderNotMatchesRegexp || [],
//   cacheBustingQueryParamName: this.props.settings.http?.cacheBustingQueryParamName,
//   tlsConfig: this.props.settings.http?.tlsConfig,

//   showHTTPSettings: false,
//   showAdvanced: false,
//   showValidation: false,
//   showAuthentication: false,
//   showTLS: false,
// };

// onUpdate = () => {
//   const settings = this.state as HttpSettings;
//   const { labels } = this.state;
//   this.props.onUpdate({
//     settings: {
//       http: settings,
//     },
//     labels,
//   });
// };

// onLabelsChange = (labels: SMLabel[]) => {
//   this.setState({ labels }, this.onUpdate);
// };

// onMethodChange = (value: SelectableValue<HttpMethod>) => {
//   this.setState({ method: value.value || HttpMethod.GET }, this.onUpdate);
// };

// onBodyChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
//   this.setState({ body: event.target.value }, this.onUpdate);
// };

// onIpVersionChange = (value: SelectableValue<IpVersion>) => {
//   this.setState({ ipVersion: value.value || IpVersion.Any }, this.onUpdate);
// };

// onNoFollowRedirectsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//   this.setState({ noFollowRedirects: !this.state.noFollowRedirects }, this.onUpdate);
// };

// onFailIfNotSSLChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//   this.setState({ failIfNotSSL: !this.state.failIfNotSSL }, this.onUpdate);
// };

// onFailIfSSLChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//   this.setState({ failIfSSL: !this.state.failIfSSL }, this.onUpdate);
// };

// onCacheBustingQueryParamNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//   this.setState({ cacheBustingQueryParamName: event.target.value }, this.onUpdate);
// };

// onToggleHTTPSettings = () => {
//   this.setState({ showHTTPSettings: !this.state.showHTTPSettings });
// };

// onToggleAdvanced = (isOpen: boolean) => {
//   this.setState({ showAdvanced: !this.state.showAdvanced });
// };

// onToggleValidation = (isOpen: boolean) => {
//   this.setState({ showValidation: !this.state.showValidation });
// };

// onAuthUpdate = (bearerToken: string | undefined, basicAuth: BasicAuth | undefined) => {
//   this.setState({ bearerToken, basicAuth }, this.onUpdate);
// };

// onToggleTLS = (isOpen: boolean) => {
//   this.setState({ showTLS: !this.state.showTLS });
// };

// onTLSChange = (tlsConfig: TLSConfig) => {
//   this.setState({ tlsConfig: tlsConfig }, this.onUpdate);
// };

// onValidHttpVersionsChange = (item: Array<SelectableValue<HttpVersion>>) => {
//   let validHTTPVersions: HttpVersion[] = [];
//   for (const p of item.values()) {
//     if (p.value) {
//       validHTTPVersions.push(p.value);
//     }
//   }
//   this.setState({ validHTTPVersions }, this.onUpdate);
// };

// onValidStatusCodeChange = (item: Array<SelectableValue<number>>) => {
//   let validStatusCodes: number[] = [];
//   for (const p of item.values()) {
//     if (p.value) {
//       validStatusCodes.push(p.value);
//     }
//   }
//   this.setState({ validStatusCodes }, this.onUpdate);
// };

// onHeadersUpdate = (labels: SMLabel[]) => {
//   let headers: string[] = [];
//   for (const l of labels) {
//     headers.push(`${l.name}: ${l.value}`);
//   }
//   this.setState({ headers }, this.onUpdate);
// };

// onFailIfBodyMatchesRegexpChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
//   let failIfBodyMatchesRegexp: string[] = [];
//   this.state.failIfBodyMatchesRegexp?.forEach((v, i) => {
//     if (i === index) {
//       failIfBodyMatchesRegexp.push(event.target.value);
//     } else {
//       failIfBodyMatchesRegexp.push(v);
//     }
//   });
//   this.setState({ failIfBodyMatchesRegexp }, this.onUpdate);
// };

// onFailIfBodyMatchesRegexpDelete = (index: number) => () => {
//   let failIfBodyMatchesRegexp: string[] = [];
//   this.state.failIfBodyMatchesRegexp?.forEach((v, i) => {
//     if (i !== index) {
//       failIfBodyMatchesRegexp.push(v);
//     }
//   });
//   this.setState({ failIfBodyMatchesRegexp }, this.onUpdate);
// };

// addFailIfBodyMatchesRegexp = () => {
//   let failIfBodyMatchesRegexp: string[] = [];
//   for (const v of this.state.failIfBodyMatchesRegexp || []) {
//     failIfBodyMatchesRegexp.push(v);
//   }
//   failIfBodyMatchesRegexp.push('');
//   this.setState({ failIfBodyMatchesRegexp }, this.onUpdate);
// };

// onFailIfBodyNotMatchesRegexpChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
//   let failIfBodyNotMatchesRegexp: string[] = [];
//   this.state.failIfBodyNotMatchesRegexp?.forEach((v, i) => {
//     if (i === index) {
//       failIfBodyNotMatchesRegexp.push(event.target.value);
//     } else {
//       failIfBodyNotMatchesRegexp.push(v);
//     }
//   });
//   this.setState({ failIfBodyNotMatchesRegexp }, this.onUpdate);
// };

// onFailIfBodyNotMatchesRegexpDelete = (index: number) => () => {
//   let failIfBodyNotMatchesRegexp: string[] = [];
//   this.state.failIfBodyNotMatchesRegexp?.forEach((v, i) => {
//     if (i !== index) {
//       failIfBodyNotMatchesRegexp.push(v);
//     }
//   });
//   this.setState({ failIfBodyNotMatchesRegexp }, this.onUpdate);
// };

// addFailIfBodyNotMatchesRegexp = () => {
//   let failIfBodyNotMatchesRegexp: string[] = [];
//   for (const v of this.state.failIfBodyNotMatchesRegexp || []) {
//     failIfBodyNotMatchesRegexp.push(v);
//   }
//   failIfBodyNotMatchesRegexp.push('');
//   this.setState({ failIfBodyNotMatchesRegexp }, this.onUpdate);
// };

// onFailIfHeaderMatchesUpdate = (headerMatches: HeaderMatch[]) => {
//   let matches: HeaderMatch[] = [];
//   if (!this.state.failIfHeaderMatchesRegexp) {
//     matches = headerMatches;
//   } else {
//     headerMatches.forEach(v => {
//       matches.push(v);
//     });
//   }
//   console.log('setting failIfHeaderMatchesRegexp', matches);
//   this.setState({ failIfHeaderMatchesRegexp: matches }, this.onUpdate);
// };

// onFailIfHeaderNotMatchesUpdate = (headerMatches: HeaderMatch[]) => {
//   let matches: HeaderMatch[] = [];
//   if (!this.state.failIfHeaderNotMatchesRegexp) {
//     matches = headerMatches;
//   } else {
//     headerMatches.forEach(v => {
//       matches.push(v);
//     });
//   }
//   this.setState({ failIfHeaderNotMatchesRegexp: matches }, this.onUpdate);
// };

export const HttpSettingsForm: FC<Props> = ({ settings, isEditor, labels }) => {
  const { register, watch, control } = useFormContext();
  const [showHttpSettings, setShowHttpSettings] = useState(false);
  const [showTLS, setShowTLS] = useState(false);
  const [showAuthentication, setShowAuthentication] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const bearerToken = watch('settings.http.bearerToken');
  const basicAuth = watch('settings.http.basicAuth');
  const [includeBearerToken, setIncludeBearerToken] = useState(Boolean(bearerToken));
  const [includeBasicAuth, setIncludeBasicAuth] = useState(Boolean(basicAuth));

  const headersToLabels = (): SMLabel[] => {
    let labels: SMLabel[] = [];
    for (const h of settings?.headers ?? []) {
      const parts = h.split(':', 2);
      labels.push({
        name: parts[0],
        value: parts[1],
      });
    }
    return labels;
  };

  return (
    <Container>
      <Collapse
        label="HTTP Settings"
        onToggle={() => setShowHttpSettings(!showHttpSettings)}
        isOpen={showHttpSettings}
        collapsible
      >
        <HorizontalGroup>
          <Field label="Request Method" description="The HTTP method the probe will use" disabled={!isEditor}>
            <Controller as={Select} name="settings.http.method" value={settings?.method} options={methodOptions} />
          </Field>
        </HorizontalGroup>
        <Container>
          <Field label="Request Body" description="The body of the HTTP request used in probe." disabled={!isEditor}>
            <div>
              <TextArea ref={register()} name="settings.http.body" rows={2} disabled={!isEditor} />
            </div>
          </Field>
        </Container>
        <Container>
          <Field label="Request Headers" description="The HTTP headers set for the probe.." disabled={!isEditor}>
            <div>
              <Controller
                as={SMLabelsForm}
                name="settings.http.headers"
                labels={headersToLabels()}
                isEditor={isEditor}
                type="Header"
                limit={10}
              />
            </div>
          </Field>
        </Container>
      </Collapse>
      <Collapse label="TLS Config" onToggle={() => setShowTLS(!showTLS)} isOpen={showTLS} collapsible>
        <HorizontalGroup>
          <Field label="Skip Validation" description="Disable target certificate validation" disabled={!isEditor}>
            <Container padding="sm">
              <Switch ref={register()} name="settings.http.tlsConfig.insecureSkipVerify" disabled={!isEditor} />
            </Container>
          </Field>
          <Field label="Server Name" description="Used to verify the hostname for the targets" disabled={!isEditor}>
            <Input
              ref={register()}
              name="settings.http.tlsConfig.serverName"
              type="text"
              placeholder="ServerName"
              disabled={!isEditor}
            />
          </Field>
        </HorizontalGroup>
        <Container>
          <Field label="CA Certificate" description="The CA cert to use for the targets" disabled={!isEditor}>
            <div>
              <TextArea
                ref={register()}
                name="settings.http.tlsConfig.caCert"
                rows={2}
                disabled={!isEditor}
                placeholder="CA Certificate"
              />
            </div>
          </Field>
        </Container>
        <Container>
          <Field label="Client Certificate" description="The client cert file for the targets" disabled={!isEditor}>
            <div>
              <TextArea
                ref={register()}
                name="settings.http.tlsConfig.caCert"
                rows={2}
                disabled={!isEditor}
                placeholder="Client Certificate"
              />
            </div>
          </Field>
        </Container>
        <Container>
          <Field label="Client Key" description="The client key file for the targets" disabled={!isEditor}>
            <div>
              <TextArea
                ref={register()}
                name="settings.http.tlsConfig.clientKey"
                type="password"
                rows={2}
                disabled={!isEditor}
                placeholder="Client Key"
              />
            </div>
          </Field>
        </Container>
      </Collapse>
      <Collapse
        label="Authentication"
        onToggle={() => setShowAuthentication(!showAuthentication)}
        isOpen={showAuthentication}
        collapsible
      >
        <VerticalGroup spacing="xs">
          <Field
            label="Bearer Token"
            description="Include bearer Authorization header in request"
            disabled={!isEditor}
            horizontal={true}
            className={
              !includeBearerToken
                ? undefined
                : css`
                    margin-bottom: 1px;
                  `
            }
          >
            <Container margin="sm">
              <Switch
                value={includeBearerToken}
                onChange={() => setIncludeBearerToken(!includeBearerToken)}
                disabled={!isEditor}
              />
            </Container>
          </Field>
          {includeBearerToken && (
            <VerticalGroup>
              <Input
                ref={register()}
                name={'settings.http.bearerToken'}
                type="password"
                placeholder="Bearer Token"
                disabled={!isEditor}
              />
              <br />
            </VerticalGroup>
          )}
        </VerticalGroup>
        <VerticalGroup spacing="xs">
          <Field
            label="Basic Auth"
            description="Include Basic Authorization header in request"
            disabled={!isEditor}
            horizontal={true}
            className={
              !includeBasicAuth
                ? undefined
                : css`
                    margin-bottom: 1px;
                  `
            }
          >
            <Container margin="sm">
              <Switch
                value={includeBasicAuth}
                onChange={() => setIncludeBasicAuth(!includeBasicAuth)}
                disabled={!isEditor}
              />
            </Container>
          </Field>
          {includeBasicAuth && (
            <HorizontalGroup>
              <Input
                ref={register()}
                name="settings.http.basicAuth.username"
                type="text"
                placeholder="username"
                disabled={!isEditor}
              />
              <Input
                ref={register()}
                name="settings.http.basicAuth.password"
                type="password"
                placeholder="password"
                disabled={!isEditor}
              />
            </HorizontalGroup>
          )}
        </VerticalGroup>
      </Collapse>
      <Collapse
        label="Validation"
        onToggle={() => setShowValidation(!showValidation)}
        isOpen={showValidation}
        collapsible
      >
        <HorizontalGroup>
          <Field
            label="Valid Status Codes"
            description="Accepted status codes for this probe. Defaults to 2xx."
            disabled={!isEditor}
          >
            <Controller
              as={MultiSelect}
              control={control}
              name="settings.http.validStatusCodes"
              options={validStatusCodes}
              disabled={!isEditor}
            />
          </Field>
          <Field label="Valid HTTP Versions" description="Accepted HTTP versions for this probe" disabled={!isEditor}>
            <Controller
              as={MultiSelect}
              control={control}
              name="settings.http.validHTTPVersions"
              options={httpVersionOptions}
              disabled={!isEditor}
            />
          </Field>

          <Field label="Fail if SSL" description="Probe fails if SSL is present" disabled={!isEditor}>
            <Container padding="sm">
              <Switch ref={register()} name="settings.http.failIfSSL" disabled={!isEditor} />
            </Container>
          </Field>
          <Field label="Fail if not SSL" description="Probe fails if SSL is not present" disabled={!isEditor}>
            <Container padding="sm">
              <Switch ref={register()} name="settings.http.failIfNotSSL" disabled={!isEditor} />
            </Container>
          </Field>
        </HorizontalGroup>

        {/* <Field
          label="Fail if body matches regexp"
          description="Probe fails if response body matches regex"
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
        </Field> */}
        {/* <Field
            label="Fail if body doesn't match regexp"
            description="Probe fails if response body does not match regex"
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
            description="Probe fails if response header matches regex. For headers with multiple values, fails if *at least one* matches"
            onChange={this.onFailIfHeaderMatchesUpdate}
            isEditor={isEditor}
          />
          <HeaderMatchForm
            headerMatches={state.failIfHeaderNotMatchesRegexp || []}
            name="Fail if header doesn't match regexp"
            description="Probe fails if response header does not match regex. For headers with multiple values, fails if *none* match."
            onChange={this.onFailIfHeaderNotMatchesUpdate}
            isEditor={isEditor}
          /> */}
      </Collapse>
      <Collapse
        label="Advanced Options"
        onToggle={() => setShowAdvanced(!showAdvanced)}
        isOpen={showAdvanced}
        collapsible
      >
        <LabelField labels={labels} isEditor={isEditor} />
        <HorizontalGroup>
          <div>
            <Field label="IP Version" description="The IP protocol of the HTTP request" disabled={!isEditor}>
              <Controller as={Select} name="settings.http.ipVersion" options={IP_OPTIONS} />
            </Field>
          </div>
          <div>
            <Field
              label="Follow Redirects"
              description="Whether or not the probe will follow any redirects."
              disabled={!isEditor}
            >
              <Container padding="sm">
                <Switch ref={register()} name="settings.http.noFollowRedirects" disabled={!isEditor} />
              </Container>
            </Field>
          </div>
        </HorizontalGroup>
        <HorizontalGroup>
          <Field
            label="Cache busting query parameter name"
            description="The name of the query parameter used to prevent the server from using a cached response. Each probe will assign a random value to this parameter each time a request is made."
          >
            <Input
              ref={register()}
              name="settings.http.cacheBustingQueryParam"
              type="string"
              placeholder="cache-bust"
              disabled={!isEditor}
            />
          </Field>
        </HorizontalGroup>
      </Collapse>
    </Container>
  );
};

// interface TLSProps {
//   tlsConfig?: TLSConfig;
//   isEditor: boolean;
//   onChange: (tlsConfig: TLSConfig) => void;
// }

// interface TLSState {
//   insecureSkipVerify: boolean;
//   caCert: string;
//   clientCert: string;
//   clientKey: string;
//   serverName: string;
// }

// export class TLSForm extends PureComponent<TLSProps, TLSState> {
//   state = {
//     insecureSkipVerify: this.props.tlsConfig?.insecureSkipVerify || false,
//     caCert: this.props.tlsConfig?.caCert || '',
//     clientCert: this.props.tlsConfig?.clientCert || '',
//     clientKey: this.props.tlsConfig?.clientKey || '',
//     serverName: this.props.tlsConfig?.serverName || '',
//   };

//   onUpdate = () => {
//     const cfg = {
//       insecureSkipVerify: this.state.insecureSkipVerify,
//       caCert: this.state.caCert,
//       clientCert: this.state.clientCert,
//       clientKey: this.state.clientKey,
//       serverName: this.state.serverName,
//     };
//     this.props.onChange(cfg);
//   };

//   onInsecureSkipVerifyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     this.setState({ insecureSkipVerify: !this.state.insecureSkipVerify }, this.onUpdate);
//   };

//   onServerNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     this.setState({ serverName: event.target.value }, this.onUpdate);
//   };

//   onCACertChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
//     this.setState({ caCert: event.target.value }, this.onUpdate);
//   };
//   onClientCertChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
//     this.setState({ clientCert: event.target.value }, this.onUpdate);
//   };
//   onClientKeyChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
//     this.setState({ clientKey: event.target.value }, this.onUpdate);
//   };

//   render() {
//     const { insecureSkipVerify, caCert, clientCert, clientKey, serverName } = this.state;
//     const { isEditor } = this.props;

//     return (
//       <div>
//         <HorizontalGroup>
//           <Field label="Skip Validation" description="Disable target certificate validation" disabled={!isEditor}>
//             <Container padding="sm">
//               <Switch value={insecureSkipVerify} onChange={this.onInsecureSkipVerifyChange} disabled={!isEditor} />
//             </Container>
//           </Field>
//           <Field label="Server Name" description="Used to verify the hostname for the targets" disabled={!isEditor}>
//             <Input
//               type="text"
//               placeholder="ServerName"
//               value={serverName}
//               onChange={this.onServerNameChange}
//               disabled={!isEditor}
//             />
//           </Field>
//         </HorizontalGroup>
//         <Container>
//           <Field label="CA Certificate" description="The CA cert to use for the targets" disabled={!isEditor}>
//             <div>
//               <TextArea
//                 value={caCert}
//                 onChange={this.onCACertChange}
//                 rows={2}
//                 disabled={!isEditor}
//                 placeholder="CA Certificate"
//               />
//             </div>
//           </Field>
//         </Container>
//         <Container>
//           <Field label="Client Certificate" description="The client cert file for the targets" disabled={!isEditor}>
//             <div>
//               <TextArea
//                 value={clientCert}
//                 onChange={this.onClientCertChange}
//                 rows={2}
//                 disabled={!isEditor}
//                 placeholder="Client Certificate"
//               />
//             </div>
//           </Field>
//         </Container>
//         <Container>
//           <Field label="Client Key" description="The client key file for the targets" disabled={!isEditor}>
//             <div>
//               <TextArea
//                 type="password"
//                 value={clientKey}
//                 onChange={this.onClientKeyChange}
//                 rows={2}
//                 disabled={!isEditor}
//                 placeholder="Client Key"
//               />
//             </div>
//           </Field>
//         </Container>
//       </div>
//     );
//   }
// }

interface HeaderMatchProps {
  headerMatches: HeaderMatch[];
  name: string;
  description: string;
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
    const { isEditor, name, description } = this.props;

    return (
      <Field label={name} description={description} disabled={!isEditor}>
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
