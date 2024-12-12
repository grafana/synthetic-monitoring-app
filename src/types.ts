import React from 'react';
import { FieldErrors, SubmitErrorHandler, SubmitHandler } from 'react-hook-form';
import { SelectableValue } from '@grafana/data';
import { EmbeddedScene, SceneRouteMatch } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';
import { ZodType } from 'zod';

import { LinkedDatasourceInfo, ProvisioningLinkedDatasourceInfo } from './datasource/types';
import { Assertion, MultiHttpEntry, MultiHttpVariable, RequestProps } from 'components/MultiHttp/MultiHttpTypes';

export interface ProvisioningJsonData {
  apiHost: string;
  stackId: number;
  metrics: ProvisioningLinkedDatasourceInfo;
  logs: ProvisioningLinkedDatasourceInfo;
}

export interface InitializedJsonData {
  apiHost: string;
  stackId: number;
  metrics: LinkedDatasourceInfo;
  logs: LinkedDatasourceInfo;
}

export enum IpVersion {
  Any = 'Any',
  V4 = 'V4',
  V6 = 'V6',
}

export enum HttpMethod {
  DELETE = 'DELETE',
  GET = 'GET',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
  PATCH = 'PATCH',
  POST = 'POST',
  PUT = 'PUT',
}

export enum HttpVersion {
  HTTP1_0 = 'HTTP/1.0',
  HTTP1_1 = 'HTTP/1.1',
  HTTP2_0 = 'HTTP/2.0',
}

export enum DnsRecordType {
  A = 'A',
  AAAA = 'AAAA',
  CNAME = 'CNAME',
  MX = 'MX',
  NS = 'NS',
  PTR = 'PTR',
  SOA = 'SOA',
  SRV = 'SRV',
  TXT = 'TXT',
}

export enum DnsProtocol {
  TCP = 'TCP',
  UDP = 'UDP',
}

export enum ProbeProvider {
  AWS = 'AWS',
  LINODE = 'Linode',
  DIGITAL_OCEAN = 'Digital Ocean',
}

export interface HeaderMatch {
  header: string;
  regexp: string;
  allowMissing: boolean;
}

export interface TLSConfig {
  caCert?: string;
  clientCert?: string;
  clientKey?: string;
  insecureSkipVerify?: boolean;
  serverName?: string;
}

export interface BasicAuth {
  username: string;
  password: string;
}

export interface DNSRRValidator {
  failIfMatchesRegexp: string[];
  failIfNotMatchesRegexp: string[];
}

export interface TCPQueryResponse {
  send: string;
  expect: string;
  startTLS: boolean;
}

export interface ExistingObject {
  created?: number; // seconds
  id?: number;
  modified?: number; // seconds
  tenantId?: number;
  updated?: number; // seconds
}

export interface Label {
  name: string;
  value: string;
}

export interface Probe extends ExistingObject {
  name: string;
  public: boolean;
  latitude: number;
  longitude: number;
  region: string;
  online: boolean;
  onlineChange: number;
  labels: Label[];
  version: string;
  deprecated: boolean;
  capabilities: ProbeCapabilities;

  provider?: ProbeProvider;
  city?: string;
  country?: string;
  countryCode?: string;
  longRegion?: string;
}

// Used to extend the Probe object with additional properties (see Probes.tsx component)
export type ExtendedProbe = Probe & { checks: number[] };

interface ProbeCapabilities {
  disableScriptedChecks: boolean;
  disableBrowserChecks: boolean;
}

export enum ResponseMatchType {
  Authority = 'Authority',
  Answer = 'Answer',
  Additional = 'Additional',
}

export interface DnsValidationFormValue {
  expression: string;
  inverted: boolean;
  responseMatch: ResponseMatchType;
}

export interface DnsSettings {
  recordType: DnsRecordType;
  server: string;
  ipVersion: IpVersion;
  protocol: DnsProtocol;
  port: number;

  // validation
  validRCodes?: DnsResponseCodes[];
  validateAnswerRRS?: DNSRRValidator;
  validateAuthorityRRS?: DNSRRValidator;
  validateAdditionalRRS?: DNSRRValidator;
}

export interface DnsSettingsFormValues
  extends Omit<DnsSettings, 'validateAnswerRRS' | 'validateAuthorityRRS' | 'validateAdditionalRRS'> {
  validations: DnsValidationFormValue[];
}

export interface ScriptedSettings {
  script: string;
}

export interface BrowserSettings {
  script: string;
}

export interface TcpSettings {
  ipVersion: IpVersion;
  tls?: boolean;
  tlsConfig?: TLSConfig;
  queryResponse?: TCPQueryResponse[];
}

export interface TcpSettingsFormValues extends TcpSettings {}

export interface HttpSettings {
  method: HttpMethod;
  headers?: string[];
  body?: string;
  ipVersion: IpVersion;
  noFollowRedirects: boolean;
  tlsConfig?: TLSConfig;
  compression?: HTTPCompressionAlgo | undefined;
  proxyURL?: string;
  proxyConnectHeaders?: string[];

  // Authentication
  bearerToken?: string;
  basicAuth?: BasicAuth;

  // validations
  failIfSSL?: boolean;
  failIfNotSSL?: boolean;
  validStatusCodes?: number[];
  validHTTPVersions?: HttpVersion[];
  failIfBodyMatchesRegexp?: string[];
  failIfBodyNotMatchesRegexp?: string[];
  failIfHeaderMatchesRegexp?: HeaderMatch[];
  failIfHeaderNotMatchesRegexp?: HeaderMatch[];

  cacheBustingQueryParamName?: string;
}

interface HttpHeaderFormValue {
  name: string;
  value: string;
}

export interface HttpRegexBodyValidationFormValue {
  matchType: HttpRegexValidationType.Body;
  expression: string;
  inverted: boolean;
}

export interface HttpRegexHeaderValidationFormValue {
  matchType: HttpRegexValidationType.Header;
  expression: string;
  inverted: boolean;
  header: string;
  allowMissing: boolean;
}

export type HttpRegexValidationFormValue = HttpRegexBodyValidationFormValue | HttpRegexHeaderValidationFormValue;

export interface HttpSettingsFormValues
  extends Omit<
    HttpSettings,
    | 'headers'
    | 'proxyConnectHeaders'
    | 'failIfSSL'
    | 'failIfNotSSL'
    | 'failIfBodyMatchesRegexp'
    | 'failIfBodyNotMatchesRegexp'
    | 'failIfHeaderMatchesRegexp'
    | 'failIfHeaderNotMatchesRegexp'
    | 'noFollowRedirects'
    | 'compression'
  > {
  sslOptions: HttpSslOption;
  headers?: HttpHeaderFormValue[];
  proxyConnectHeaders?: HttpHeaderFormValue[];
  regexValidations: HttpRegexValidationFormValue[];
  followRedirects: boolean;
  compression: HTTPCompressionAlgo;
  proxyURL?: string;
}

export interface MultiHttpSettings {
  entries: MultiHttpEntry[];
}

export interface MultiHttpSettingsFormValues {
  entries: MultiHttpEntryFormValues[];
}

export interface MultiHttpEntryFormValues extends Omit<MultiHttpEntry, 'request' | 'variables' | 'checks'> {
  request: RequestProps;
  variables?: MultiHttpVariable[];
  checks?: Assertion[];
}

export interface TracerouteSettings {
  maxHops: number;
  maxUnknownHops: number;
  ptrLookup: boolean;
  hopTimeout: number;
}

export interface TracerouteSettingsFormValues {
  maxHops: number;
  maxUnknownHops: number;
  ptrLookup: boolean;
  hopTimeout: number;
}

export interface PingSettings {
  ipVersion: IpVersion;
  dontFragment: boolean;
}

export interface PingSettingsFormValues extends PingSettings {}

export interface GRPCSettings {
  ipVersion: IpVersion;
  service?: string;
  tls?: boolean;
  tlsConfig?: TLSConfig;
}

export interface GRPCSettingsFormValues extends GRPCSettings {}

export interface AlertFormValues {
  name: string;
  probePercentage: number;
  timeCount: number;
  timeUnit: SelectableValue<TimeUnits>;
  labels: Label[];
  annotations: Label[];
  sensitivity: SelectableValue<AlertSensitivity>;
}
export interface CheckAlertFormValues {
  id?: number;
  threshold?: number;
  isSelected?: boolean;
}

export type CheckAlertFormRecord = Partial<Record<CheckAlertType, CheckAlertFormValues>>;

export type CheckFormValuesBase = Omit<Check, 'settings' | 'basicMetricsOnly'> & {
  publishAdvancedMetrics: boolean;
  alerts?: CheckAlertFormRecord;
};

export type CheckFormValuesHttp = CheckFormValuesBase & {
  checkType: CheckType.HTTP;
  settings: {
    http: HttpSettingsFormValues;
  };
};

export type CheckFormValuesMultiHttp = CheckFormValuesBase & {
  checkType: CheckType.MULTI_HTTP;
  settings: {
    multihttp: MultiHttpSettingsFormValues;
  };
};

export type CheckFormValuesPing = CheckFormValuesBase & {
  checkType: CheckType.PING;
  settings: {
    ping: PingSettingsFormValues;
  };
};

export type CheckFormValuesDns = CheckFormValuesBase & {
  checkType: CheckType.DNS;
  settings: {
    dns: DnsSettingsFormValues;
  };
};

export type CheckFormValuesGRPC = CheckFormValuesBase & {
  checkType: CheckType.GRPC;
  settings: {
    grpc: GRPCSettingsFormValues;
  };
};

export type CheckFormValuesTcp = CheckFormValuesBase & {
  checkType: CheckType.TCP;
  settings: {
    tcp: TcpSettingsFormValues;
  };
};

export type CheckFormValuesTraceroute = CheckFormValuesBase & {
  checkType: CheckType.Traceroute;
  settings: {
    traceroute: TracerouteSettingsFormValues;
  };
};

export type CheckFormValuesScripted = CheckFormValuesBase & {
  checkType: CheckType.Scripted;
  settings: {
    scripted: ScriptedSettings;
  };
};

export type CheckFormValuesBrowser = CheckFormValuesBase & {
  checkType: CheckType.Browser;
  settings: {
    browser: BrowserSettings;
  };
};

export interface CheckBase {
  job: string;
  target: string;
  frequency: number;
  timeout: number;
  enabled: boolean;
  alertSensitivity: AlertSensitivity | string;
  basicMetricsOnly: boolean;
  labels: Label[]; // Currently list of [name:value]... can it be Labels?
  probes: number[];
  alerts?: CheckAlertFormRecord;
}

export type Check =
  | BrowserCheck
  | DNSCheck
  | GRPCCheck
  | HTTPCheck
  | MultiHTTPCheck
  | PingCheck
  | ScriptedCheck
  | TCPCheck
  | TracerouteCheck;

export type CheckFormValues =
  | CheckFormValuesDns
  | CheckFormValuesGRPC
  | CheckFormValuesHttp
  | CheckFormValuesMultiHttp
  | CheckFormValuesPing
  | CheckFormValuesScripted
  | CheckFormValuesTcp
  | CheckFormValuesTraceroute
  | CheckFormValuesBrowser;

export interface FilteredCheck extends Omit<Check, 'id'> {
  id: number;
}

export type Settings =
  | BrowserCheck['settings']
  | DNSCheck['settings']
  | GRPCCheck['settings']
  | HTTPCheck['settings']
  | ScriptedCheck['settings']
  | MultiHTTPCheck['settings']
  | PingCheck['settings']
  | TCPCheck['settings']
  | TracerouteCheck['settings'];

export type DNSCheck = CheckBase &
  ExistingObject & {
    settings: {
      dns: DnsSettings;
    };
  };

export type GRPCCheck = CheckBase &
  ExistingObject & {
    settings: {
      grpc: GRPCSettings;
    };
  };

export type HTTPCheck = CheckBase &
  ExistingObject & {
    settings: {
      http: HttpSettings;
    };
  };

export type ScriptedCheck = CheckBase &
  ExistingObject & {
    settings: {
      scripted: ScriptedSettings;
    };
  };

export type BrowserCheck = CheckBase &
  ExistingObject & {
    settings: {
      browser: BrowserSettings;
    };
  };

export type MultiHTTPCheck = CheckBase &
  ExistingObject & {
    settings: {
      multihttp: MultiHttpSettings;
    };
  };

export type PingCheck = CheckBase &
  ExistingObject & {
    settings: {
      ping: PingSettings;
    };
  };

export type TCPCheck = CheckBase &
  ExistingObject & {
    settings: {
      tcp: TcpSettings;
    };
  };

export type TracerouteCheck = CheckBase &
  ExistingObject & {
    settings: {
      traceroute: TracerouteSettings;
    };
  };

export enum CheckType {
  Browser = 'browser',
  DNS = 'dns',
  GRPC = 'grpc',
  HTTP = 'http',
  MULTI_HTTP = 'multihttp',
  PING = 'ping',
  Scripted = 'scripted',
  TCP = 'tcp',
  Traceroute = 'traceroute',
}

export enum CheckTypeGroup {
  ApiTest = `api-endpoint`,
  MultiStep = `multistep`,
  Scripted = `scripted`,
  Browser = `browser`,
}

export enum DnsResponseCodes {
  NOERROR = 'NOERROR',
  BADALG = 'BADALG',
  BADCOOKIE = 'BADCOOKIE',
  BADKEY = 'BADKEY',
  BADMODE = 'BADMODE',
  BADNAME = 'BADNAME',
  BADSIG = 'BADSIG',
  BADTIME = 'BADTIME',
  BADTRUNC = 'BADTRUNC',
  BADVERS = 'BADVERS',
  FORMERR = 'FORMERR',
  NOTAUTH = 'NOTAUTH',
  NOTIMP = 'NOTIMP',
  NOTZONE = 'NOTZONE',
  NXDOMAIN = 'NXDOMAIN',
  NXRRSET = 'NXRRSET',
  REFUSED = 'REFUSED',
  SERVFAIL = 'SERVFAIL',
  YXDOMAIN = 'YXDOMAIN',
  YXRRSET = 'YXRRSET',
}

export interface APIError {
  status: number;
  message: string;
}

export interface OnUpdateSettingsArgs {
  settings: Settings;
  labels?: Label[];
}

export enum HttpSslOption {
  Ignore,
  FailIfPresent,
  FailIfNotPresent,
}

export enum HttpRegexValidationType {
  Header = 'Header',
  Body = 'Body',
}

export interface SubmissionError {
  message?: string;
  msg?: string;
  err?: string;
}

export interface SubmissionErrorWrapper {
  data: SubmissionError;
  status?: string;
  message?: string;
}

export interface DashboardMeta {
  json: string;
  latestVersion: number;
  title: string;
  uid: string;
  version: number;
}

export enum TimeUnits {
  Seconds = 's',
  Minutes = 'm',
  Hours = 'h',
}

export enum AlertFamily {
  ProbeSuccess = 'probeSuccess',
}

export enum AlertSeverity {
  Critical = 'critical',
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
}

export enum AlertSensitivity {
  None = 'none',
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export type AlertRecord = AlertRecordingRule | AlertRule;

export type AlertRecordingRule = {
  record: string;
  expr: string;
};

export type AlertRule = {
  alert: string;
  expr: string;
  for?: string;
  labels?: {
    [key: string]: string;
  };
  annotations?: {
    [key: string]: string;
  };
  record?: string;
};

export type AlertDescription = {
  metric: string;
  sensitivity: AlertSensitivity;
  operator: string;
  threshold: number;
};

export type AlertFilter = (record: PrometheusAlertRecord) => boolean;

export enum CheckAlertType {
  ProbeFailedExecutionsTooHigh = 'ProbeFailedExecutionsTooHigh',
  HTTPRequestDurationTooHighP50 = 'HTTPRequestDurationTooHighP50',
  HTTPRequestDurationTooHighP90 = 'HTTPRequestDurationTooHighP90',
  HTTPRequestDurationTooHighP95 = 'HTTPRequestDurationTooHighP95',
  HTTPRequestDurationTooHighP99 = 'HTTPRequestDurationTooHighP99',
  HTTPTargetCertificateCloseToExpiring = 'HTTPTargetCertificateCloseToExpiring',
  PingICMPDurationTooHighP50 = 'PingICMPDurationTooHighP50',
  PingICMPDurationTooHighP90 = 'PingICMPDurationTooHighP90',
  PingICMPDurationTooHighP95 = 'PingICMPDurationTooHighP95',
  PingICMPDurationTooHighP99 = 'PingICMPDurationTooHighP99',
}

export type CheckAlertBase = {
  name: CheckAlertType;
  threshold: number;
};

export type CheckAlertDraft = CheckAlertBase & {
  id?: number;
};

export type CheckAlertPublished = CheckAlertBase & {
  id: number;
  created: number;
  modified: number;
};

export type ThresholdUnit = 'ms' | 's' | 'd' | '%';

export enum CheckSort {
  AToZ = 'atoz',
  ZToA = 'ztoa',
  ReachabilityDesc = 'reachabilityDesc',
  ReachabilityAsc = 'reachabilityAsc',
  ExecutionsDesc = 'executionsDesc',
  ExecutionsAsc = 'executionsAsc',
}

export enum CheckEnabledStatus {
  All = 'all',
  Enabled = 'enabled',
  Disabled = 'disabled',
}

export enum HTTPCompressionAlgo {
  none = '',
  identity = 'identity',
  br = 'br',
  gzip = 'gzip',
  deflate = 'deflate',
}

export enum FeatureName {
  BrowserChecks = 'browser-checks',
  GRPCChecks = 'grpc-checks',
  ScriptedChecks = 'scripted-checks',
  UnifiedAlerting = 'ngalert',
  UptimeQueryV2 = 'uptime-query-v2',
  RBAC = 'synthetic-monitoring-rbac',
  __TURNOFF = 'test-only-do-not-use',
}

export interface UsageValues {
  checksPerMonth: number;
  activeSeries: number;
  logsGbPerMonth: number;
  dpm: number;
}

interface Params extends Record<string, string | undefined> {}

export interface CheckPageParams extends Params {
  id: string;
  checkType?: CheckType;
}

export interface CheckFormPageParams extends Params {
  checkTypeGroup?: CheckTypeGroup;
  id?: string;
}

export interface ProbePageParams extends Params {
  view?: string;
  id?: string;
}

export interface DashboardSceneAppConfig {
  metrics: DataSourceRef;
  logs: DataSourceRef;
  sm: DataSourceRef;
  singleCheckMode?: boolean;
}

export enum MultiHttpVariableType {
  JSON_PATH = 0,
  REGEX = 1,
  CSS_SELECTOR = 2,
}

export enum MultiHttpAssertionType {
  Text = 0,
  JSONPathValue = 1,
  JSONPath = 2,
  Regex = 3,
}

export type SceneBuilder<T extends { [K in keyof T]?: string | undefined } = any> = (
  routeMatch: RouteMatch<T>
) => EmbeddedScene;

export type RouteMatch<T extends { [K in keyof T]?: string | undefined } = any> = SceneRouteMatch<T>;

export interface ThresholdValues {
  upperLimit: number;
  lowerLimit: number;
}

export interface ThresholdSettings {
  latency: ThresholdValues;
  reachability: ThresholdValues;
  uptime: ThresholdValues;
}

export interface CalculateUsageValues {
  assertionCount: number;
  basicMetricsOnly: boolean;
  checkType: CheckType;
  frequencySeconds: number;
  isSSL: boolean;
  probeCount: number;
}

export type PrometheusAlertsGroup = {
  evaulationTime: number;
  file: string;
  interval: number;
  lastEvaluation: string;
  name: string;
  rules: PrometheusAlertRecord[];
  totals: null;
};

export type PrometheusAlertRecord = PrometheusAlertRecordingRule | PrometheusAlertingRule;

export type PrometheusAlertRecordingRule = {
  evaluationTime: number;
  health: `ok`; // fill in others
  lastEvaluation: string;
  name: string;
  query: string;
  type: `recording`;
};

export type PrometheusAlertingRule = {
  annotations: {
    description: string;
    summary: string;
  };
  duration: number;
  evaluationTime: number;
  health: `ok`; // fill in others
  labels: {
    [key: string]: string;
  };
  lastEvaluation: string;
  name: string;
  query: string;
  state: 'inactive'; // fill in others
  type: `alerting`;
};

export enum CheckStatus {
  EXPERIMENTAL = 'experimental',
  PRIVATE_PREVIEW = 'private-preview',
  PUBLIC_PREVIEW = 'public-preview',
}

export interface CheckFormTypeLayoutProps {
  formActions: React.JSX.Element[];
  onSubmit: SubmitHandler<CheckFormValues>;
  onSubmitError?: SubmitErrorHandler<CheckFormValues>;
  errorMessage?: string;
  schema: ZodType;
  checkType?: CheckType;
}

export type TLSCheckTypes = CheckType.HTTP | CheckType.TCP | CheckType.GRPC;

export interface TLSFormValues extends CheckFormValuesBase {
  checkType: TLSCheckTypes;
  settings: {
    [key in TLSCheckTypes]: {
      tls?: boolean;
      tlsConfig?: TLSConfig;
    };
  };
}

export interface CheckFormInvalidSubmissionEvent {
  errs: FieldErrors<CheckFormValues>;
  source: string;
}

type PermissionBase = 'grafana-synthetic-monitoring-app';
export type PluginPermissions =
  | `${PermissionBase}:${'read' | 'write'}`
  | `${PermissionBase}.checks:${'read' | 'write' | 'delete'}`
  | `${PermissionBase}.probes:${'read' | 'write' | 'delete'}`
  | `${PermissionBase}.alerts:${'read' | 'write' | 'delete'}`
  | `${PermissionBase}.thresholds:${'read' | 'write' | 'delete'}`
  | `${PermissionBase}.access-tokens:${'write'}`
  | `${PermissionBase}.plugin:${'write'}`;
