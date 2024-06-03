import React from 'react';
import { SubmitErrorHandler, SubmitHandler } from 'react-hook-form';
import { DataSourceSettings, OrgRole, SelectableValue } from '@grafana/data';
import { EmbeddedScene, SceneRouteMatch } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';
import { ZodType } from 'zod';

import { LinkedDatasourceInfo } from './datasource/types';
import { SMDataSource } from 'datasource/DataSource';
import { Assertion, MultiHttpEntry, MultiHttpVariable, RequestProps } from 'components/MultiHttp/MultiHttpTypes';

export interface GlobalSettings {
  apiHost: string;
  stackId?: number;
  metrics: LinkedDatasourceInfo;
  logs: LinkedDatasourceInfo;
}

export enum IpVersion {
  Any = 'Any',
  V4 = 'V4',
  V6 = 'V6',
}

export enum HttpMethod {
  GET = 'GET',
  HEAD = 'HEAD',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  OPTIONS = 'OPTIONS',
  DELETE = 'DELETE',
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
  id?: number;
  tenantId?: number;
  created?: number; // seconds
  updated?: number; // seconds
  modified?: number; // seconds
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
}

interface ProbeCapabilities {
  disableScriptedChecks: boolean;
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

export interface TcpSettings {
  ipVersion: IpVersion;
  tls: boolean;
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
  headers: HttpHeaderFormValue[];
  proxyConnectHeaders: HttpHeaderFormValue[];
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

export type CheckFormValuesBase = Omit<Check, 'settings' | 'basicMetricsOnly'> & {
  publishAdvancedMetrics: boolean;
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
}

export type Check =
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
  | CheckFormValuesTraceroute;

export type CheckTypeFilter = CheckType | 'all';

export interface FilteredCheck extends Omit<Check, 'id'> {
  id: number;
}

export type Settings =
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
  ApiTest = `api-test`,
  MultiStep = `multistep`,
  Scripted = `scripted`,
}

export interface HostedInstance {
  id: number;
  orgSlug: string;
  orgName: string;
  clusterSlug: string;
  clusterName: string;
  type: string; // "prometheus" "logs",
  name: string;
  url: string;
  description: string;
  status: string;
  currentActiveSeries: number;
  currentDpm: number;
  currentUsage: number;
}

export interface GrafanaInstances {
  api?: SMDataSource;
  metrics?: DataSourceSettings;
  logs?: DataSourceSettings;
  alertRuler?: DataSourceSettings;
}

export interface User {
  email: string;
  id: number;
  isGrafanaAdmin: boolean;
  isSignedIn: boolean;
  orgId: number;
  orgName: string;
  orgRole: OrgRole;
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

export enum CheckSort {
  AToZ = 'atoz',
  ZToA = 'ztoa',
  ReachabilityDesc = 'reachabilityDesc',
  ReachabilityAsc = 'reachabilityAsc',
}

export enum CheckEnabledStatus {
  All,
  Enabled,
  Disabled,
}

export enum CheckListViewType {
  Card,
  List,
  Viz,
}

export enum HTTPCompressionAlgo {
  none = '',
  identity = 'identity',
  br = 'br',
  gzip = 'gzip',
  deflate = 'deflate',
}

export enum FeatureName {
  UnifiedAlerting = 'ngalert',
  ScriptedChecks = 'scripted-checks',
  GRPCChecks = 'grpc-checks',
}

export interface UsageValues {
  checksPerMonth: number;
  activeSeries: number;
  logsGbPerMonth: number;
  dpm: number;
}

export enum ROUTES {
  Redirect = 'redirect',
  Home = 'home',
  Probes = 'probes',
  NewProbe = 'probes/new',
  EditProbe = 'probes/edit',
  Alerts = 'alerts',
  Checks = 'checks',
  NewCheck = 'checks/new',
  EditCheck = 'checks/edit',
  Config = 'config',
  Scene = 'scene',
  ChooseCheckGroup = 'checks/choose-type',
  ScriptedChecks = 'scripted-checks',
}

export interface CheckPageParams {
  id: string;
  checkType?: CheckType;
}

export interface CheckFormPageParams {
  checkTypeGroup: CheckTypeGroup;
}

export interface ProbePageParams {
  view?: string;
  id?: string;
}

export interface DashboardSceneAppConfig {
  metrics: DataSourceRef;
  logs: DataSourceRef;
  sm: DataSourceRef;
  singleCheckMode?: boolean;
}

export interface VizViewSceneAppConfig extends DashboardSceneAppConfig {
  checkFilters: CheckFiltersType;
  checks: Check[];
  onReset: () => void;
  onFilterChange: (filters: CheckFiltersType) => void;
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

export interface CheckFiltersType {
  [key: string]: any;

  search: string;
  labels: string[];
  type: CheckTypeFilter;
  status: SelectableValue<CheckEnabledStatus>;
  probes: SelectableValue[] | [];
}

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
