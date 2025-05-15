import {
  BasicAuth,
  DnsSettings,
  GRPCSettings,
  HeaderMatch,
  HttpSettings,
  Label,
  Probe,
  TCPQueryResponse,
  TcpSettings,
} from 'types';
import {
  MultiHttpEntry,
  MultiHttpRequestBody,
  MultiHttpVariable,
  RequestProps,
} from 'components/MultiHttp/MultiHttpTypes';

export interface TFOutput {
  config: TFConfig;
  checkCommands: string[];
  checkAlertsCommands: string[];
  probeCommands: string[];
}

export interface TFConfig {
  provider: any;
  terraform: any;
  // data: any;
  resource: {
    grafana_synthetic_monitoring_check?: TFCheckConfig;
    grafana_synthetic_monitoring_probe?: TFProbeConfig;
    grafana_synthetic_monitoring_check_alerts?: TFCheckAlertsConfig;
  };
}

export interface TFCheckConfig {
  [key: string]: TFCheck;
}

export interface TFCheck {
  job: string;
  target: string;
  enabled: boolean;
  probes: number[];
  labels: TFLabels;
  settings: TFCheckSettings;
  frequency: number;
  timeout: number;
}

export type TFLabels = { [key: string]: string };

type KeyedTFHttpSettings = {
  http: TFHttpSettings;
};

type KeyedTFPingSettings = {
  ping: TFPingSettings;
};

type KeyedTFTcpSettings = {
  tcp: TFTcpSettings;
};

type KeyedTFDnsSettings = {
  dns: TFDnsSettings;
};

type KeyedTFTracerouteSettings = {
  traceroute: TFTracerouteSettings;
};

type KeyedTFMultiHTTPSettings = {
  multihttp: TFMultiHTTPSettings;
};

type KeyedTFScriptedSettings = {
  scripted: {};
};

type KeyedTFBrowserSettings = {
  browser: {};
};

type KeyedTFGRPCCheckSettings = {
  grpc: TFGRPCSettings;
};

export type TFCheckSettings =
  | KeyedTFBrowserSettings
  | KeyedTFDnsSettings
  | KeyedTFGRPCCheckSettings
  | KeyedTFHttpSettings
  | KeyedTFMultiHTTPSettings
  | KeyedTFPingSettings
  | KeyedTFScriptedSettings
  | KeyedTFTcpSettings
  | KeyedTFTracerouteSettings;

interface TFFailIfMatchesNotMatches {
  fail_if_matches_regexp?: string[];
  fail_if_not_matches_regexp?: string[];
}

interface TFDnsSettings
  extends Omit<
    DnsSettings,
    'ipVersion' | 'recordType' | 'validRCodes' | 'validateAnswerRRS' | 'validateAuthorityRRS' | 'validationAditionalRRS'
  > {
  ip_version?: string;
  record_type?: string;
  valid_r_codes?: string[];
  validate_answer_rrs?: TFFailIfMatchesNotMatches;
  validate_authority_rrs?: TFFailIfMatchesNotMatches;
  validate_additional_rrs?: TFFailIfMatchesNotMatches;
}

interface TFGRPCSettings extends Omit<GRPCSettings, 'ipVersion' | 'tlsConfig'> {
  ip_version?: string;
  tls_config?: TFTlsConfig;
}

interface TFHttpSettings
  extends Omit<
    HttpSettings,
    | 'ipVersion'
    | 'validStatusCodes'
    | 'noFollowRedirects'
    | 'tlsConfig'
    | 'proxyURL'
    | 'proxyConnectHeaders'
    | 'bearerToken'
    | 'basicAuth'
    | 'failIfSSL'
    | 'failIfNotSSL'
    | 'validHTTPVersions'
    | 'failIfBodyMatchesRegexp'
    | 'failIfBodyNotMatchesRegexp'
    | 'failIfHeaderMatchesRegexp'
    | 'failIfHeaderNotMatchesRegexp'
    | 'cacheBustingQueryParamName'
  > {
  basic_auth?: BasicAuth;
  bearer_token?: string;
  cache_busting_query_param_name?: string;
  fail_if_body_matches_regexp?: string[];
  fail_if_body_not_matches_regexp?: string[];
  fail_if_header_matches_regexp?: TFHeaderMatch[];
  fail_if_header_not_matches_regexp?: TFHeaderMatch[];
  fail_if_not_ssl?: boolean;
  fail_if_ssl?: boolean;
  ip_version: string;
  no_follow_redirects?: boolean;
  proxy_url?: string;
  proxy_connect_headers?: string[];
  tls_config?: TFTlsConfig;
  valid_http_versions?: string[];
  valid_status_codes?: number[];
}

interface TFPingSettings {
  ip_version: string;
  payload_size?: number;
  dont_fragment: boolean;
}

interface TFTcpSettings extends Omit<TcpSettings, 'ipVersion' | 'queryResponse' | 'tlsConfig'> {
  ip_version?: string;
  query_response?: TCPQueryResponse[];
  tls_config?: TFTlsConfig;
}

interface TFTracerouteSettings {
  max_hops: number;
  max_unknown_hops: number;
  ptr_lookup: boolean;
}

interface TFMultiHTTPSettings {
  entries: TFMultiHttpEntry[];
}

export type TFMultiHTTPAssertionType = 'TEXT' | 'JSON_PATH_VALUE' | 'JSON_PATH_ASSERTION' | 'REGEX_ASSERTION';
export type TFMultiHTTPAssertionCondition =
  | 'NOT_CONTAINS'
  | 'EQUALS'
  | 'STARTS_WITH'
  | 'ENDS_WITH'
  | 'TYPE_OF'
  | 'CONTAINS';
export type TFMultiHttpAssertionSubject = 'RESPONSE_HEADERS' | 'HTTP_STATUS_CODE' | 'RESPONSE_BODY';

export type TFMultiHTTPVariableType = 'JSON_PATH' | 'REGEX' | 'CSS_SELECTOR';

export interface TFMultiHttpRequestBody extends Omit<MultiHttpRequestBody, 'contentType' | 'contentEncoding'> {
  content_type?: string;
  content_encoding?: string;
}

export interface TFMultiHttpAssertion {
  type: TFMultiHTTPAssertionType;
  condition?: TFMultiHTTPAssertionCondition;
  subject?: TFMultiHttpAssertionSubject;
  expression?: string;
  value?: string;
}

export interface TFMultiHttpVariable extends Omit<MultiHttpVariable, 'type'> {
  type: TFMultiHTTPVariableType;
}

export interface TFMultiHttpEntry extends Omit<MultiHttpEntry, 'request' | 'checks' | 'variables'> {
  request: TFMultiHttpRequest;
  assertions?: TFMultiHttpAssertion[];
  variables?: TFMultiHttpVariable[];
}
interface TFMultiHttpRequest extends Omit<RequestProps, 'queryFields' | 'postData' | 'body'> {
  query_fields?: Label[];
  post_data?: {
    mime_type: string;
    text: string;
  };
  body?: TFMultiHttpRequestBody;
}

interface TFHeaderMatch extends Omit<HeaderMatch, 'allowMissing'> {
  allow_missing?: string;
}

export interface TFTlsConfig {
  ca_cert?: string;
  client_cert?: string;
  client_key?: string;
  insecure_skip_verify?: boolean;
  server_name?: string;
}

export interface TFProbeConfig {
  [key: string]: TFProbe;
}

export interface TFProbe
  extends Omit<Probe, 'online' | 'onlineChange' | 'version' | 'deprecated' | 'labels' | 'capabilities'> {
  labels: TFLabels;
  disable_scripted_checks: boolean;
  disable_browser_checks: boolean;
}

export interface TFCheckAlertsConfig {
  [key: string]: TFCheckAlerts;
}

export interface TFCheckAlerts {
  check_id: string;
  alerts: Array<{
    name: string;
    threshold: number;
    period?: string;
  }>;
}
