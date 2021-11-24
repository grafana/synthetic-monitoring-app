import { DnsSettings, HttpSettings, BasicAuth, HeaderMatch, TcpSettings, TCPQueryResponse } from 'types';

export interface TFConfig {
  // provider: any;
  resource: {
    grafana_synthetic_monitoring_check: TFCheckConfig;
  };
}

export interface TFCheckConfig {
  dns?: TFCheck[];
  http?: TFCheck[];
  ping?: TFCheck[];
  tcp?: TFCheck[];
  traceroute?: TFCheck[];
}

export interface TFCheck {
  job: string;
  target: string;
  enabled: boolean;
  probes: string[];
  labels: TFLabels;
  settings: TFCheckSettings;
}

export type TFLabels = { [key: string]: string };
type TFSettings = TFHttpSettings | TFPingSettings | TFTcpSettings | TFDnsSettings | TFTracerouteSettings;
export type TFCheckSettings = {
  [key: string]: TFSettings;
};

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
  validate_answer_rrs: TFFailIfMatchesNotMatches;
  validate_authority_rrs: TFFailIfMatchesNotMatches;
  validate_additional_rrs: TFFailIfMatchesNotMatches;
}

interface TFHttpSettings
  extends Omit<
    HttpSettings,
    | 'ipVersion'
    | 'validStatusCodes'
    | 'noFollowRedirects'
    | 'tlsConfig'
    | 'proxyURL'
    | 'bearerToken'
    | 'basicAuth'
    | 'failIfSSL'
    | 'failIfNotSSL'
    | 'validStatusCodes'
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
  steve: string;
}

interface TFHeaderMatch extends Omit<HeaderMatch, 'allowMissing'> {
  allow_missing?: string;
}

export interface TFTlsConfig {
  ca_cert: string;
  client_cert: string;
  client_key: string;
  insecure_skip_verify: boolean;
  server_name: string;
}
