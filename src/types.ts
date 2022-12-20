import { DataSourceSettings, OrgRole, SelectableValue } from '@grafana/data';
import { LinkedDatasourceInfo } from './datasource/types';
import { SMDataSource } from 'datasource/DataSource';

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
  insecureSkipVerify: boolean;
  caCert: string;
  clientCert: string;
  clientKey: string;
  serverName: string;
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

export interface BaseObject {
  id?: number;
  tenantId?: number;
  created?: number; // seconds
  updated?: number; // seconds
}

export interface Label {
  name: string;
  value: string;
}

export interface Probe extends BaseObject {
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
}

export enum ResponseMatchType {
  Authority = 'Authority',
  Answer = 'Answer',
  Additional = 'Additional',
}

export interface DnsValidationFormValue {
  expression: string;
  inverted: boolean;
  responseMatch: SelectableValue<ResponseMatchType>;
}

export interface DnsSettings {
  recordType: DnsRecordType;
  server: string;
  ipVersion: IpVersion;
  protocol: DnsProtocol;
  port: number;

  // validation
  validRCodes?: string[];
  validateAnswerRRS?: DNSRRValidator;
  validateAuthorityRRS?: DNSRRValidator;
  validateAditionalRRS?: DNSRRValidator;
}

export interface DnsSettingsFormValues
  extends Omit<
    DnsSettings,
    | 'ipVersion'
    | 'protocol'
    | 'recordType'
    | 'validRCodes'
    | 'validateAnswerRRS'
    | 'validateAuthorityRRS'
    | 'validateAdditionalRRS'
  > {
  ipVersion: SelectableValue<IpVersion>;
  protocol: SelectableValue<DnsProtocol>;
  recordType: SelectableValue<DnsRecordType>;
  validRCodes: Array<SelectableValue<string>>;
  validations: DnsValidationFormValue[];
}

export interface TcpSettings {
  ipVersion: IpVersion;
  tls: boolean;
  tlsConfig?: TLSConfig;
  queryResponse?: TCPQueryResponse[];
}

export interface TcpSettingsFormValues extends Omit<TcpSettings, 'ipVersion'> {
  ipVersion: SelectableValue<IpVersion>;
}
// HttpSettings provides the settings for a HTTP check.
export interface HttpSettings {
  method: HttpMethod;
  headers?: string[];
  body?: string;
  ipVersion: IpVersion;
  noFollowRedirects: boolean;
  tlsConfig?: TLSConfig;
  compression: HTTPCompressionAlgo | undefined;
  proxyURL?: string;

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

export interface MultiHttpSettings extends HttpSettings {
  mutliUrls: string[];
}

interface HttpHeaderFormValue {
  name: string;
  value: string;
}

export interface HttpRegexValidationFormValue {
  matchType: SelectableValue<HttpRegexValidationType>;
  expression: string;
  inverted: boolean;
  header?: string;
  allowMissing?: boolean;
}

export interface HttpSettingsFormValues
  extends Omit<
    HttpSettings,
    | 'validStatusCodes'
    | 'validHTTPVersions'
    | 'method'
    | 'ipVersion'
    | 'headers'
    | 'failIfSSL'
    | 'failIfNotSSL'
    | 'failIfBodyMatchesRegexp'
    | 'failIfBodyNotMatchesRegexp'
    | 'failIfHeaderMatchesRegexp'
    | 'failIfHeaderNotMatchesRegexp'
    | 'noFollowRedirects'
    | 'compression'
  > {
  sslOptions: SelectableValue<HttpSslOption>;
  validStatusCodes: Array<SelectableValue<number>>;
  validHTTPVersions: Array<SelectableValue<HttpVersion>>;
  method: SelectableValue<HttpMethod>;
  ipVersion: SelectableValue<IpVersion>;
  headers: HttpHeaderFormValue[];
  regexValidations: HttpRegexValidationFormValue[];
  followRedirects: boolean;
  compression: SelectableValue<HTTPCompressionAlgo>;
  proxyURL?: string;
}

export interface MultiHttpSettingsFormValues extends HttpSettingsFormValues {
  multiUrls: string[];
}

export interface TracerouteSettings {
  maxHops: number;
  maxUnknownHops: number;
  ptrLookup: boolean;
}

export interface TracerouteSettingsFormValues {
  maxHops: string;
  maxUnknownHops: string;
  ptrLookup: boolean;
}

export interface PingSettings {
  ipVersion: IpVersion;
  dontFragment: boolean;
}

export interface PingSettingsFormValues extends Omit<PingSettings, 'ipVersion'> {
  ipVersion: SelectableValue<IpVersion>;
}

export interface SettingsFormValues {
  http?: HttpSettingsFormValues;
  multiHttp?: MultiHttpSettingsFormValues;
  ping?: PingSettingsFormValues;
  dns?: DnsSettingsFormValues;
  tcp?: TcpSettingsFormValues;
  traceroute?: TracerouteSettingsFormValues;
}
export interface AlertFormValues {
  name: string;
  probePercentage: number;
  timeCount: number;
  timeUnit: SelectableValue<TimeUnits>;
  labels: Label[];
  annotations: Label[];
  sensitivity: SelectableValue<AlertSensitivity>;
}

export interface CheckFormValues extends Omit<Check, 'settings' | 'labels' | 'alertSensitivity'> {
  checkType: SelectableValue<CheckType>;
  settings: SettingsFormValues;
  labels?: Label[];
  alertSensitivity: SelectableValue<string>;
  publishAdvancedMetrics: boolean;
}

export interface Check extends BaseObject {
  job: string;
  multiHTTP?: string;
  target: string;
  frequency: number;
  offset?: number;
  timeout: number;
  enabled: boolean;
  alertSensitivity: AlertSensitivity | string;
  basicMetricsOnly: boolean;
  labels: Label[]; // Currently list of [name:value]... can it be Labels?
  settings: Settings; //
  k6MultiHttpCheckName: string;

  // Link to probes
  probes: number[];
  id?: number;
  tenantId?: number;
}

export interface FilteredCheck extends Omit<Check, 'id'> {
  id: number;
}

export interface Settings {
  http?: HttpSettings;
  multiHttp?: MultiHttpSettings;
  ping?: PingSettings;
  dns?: DnsSettings;
  tcp?: TcpSettings;
  traceroute?: TracerouteSettings;
}

export enum CheckType {
  HTTP = 'http',
  PING = 'ping',
  DNS = 'dns',
  TCP = 'tcp',
  Traceroute = 'traceroute',
  MULTI_HTTP = 'multiHttp',
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

export interface RegistrationInfo {
  accessToken: string;
  tenantInfo: {
    id: number;
    metricInstance: HostedInstance;
    logInstance: HostedInstance;
  };
  instances: HostedInstance[];
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

export enum CheckSort {
  AToZ,
  ZToA,
  SuccessRate,
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
  Traceroute = 'traceroute',
  AdhocChecks = 'synthetics-adhocchecks',
  UnifiedAlerting = 'ngalert',
  MultiHttp = 'multi-http',
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
  Setup = 'setup',
  Unprovisioned = 'unprovisioned',
  Probes = 'probes',
  NewProbe = 'probes/new',
  EditProbe = 'probes/edit',
  Alerts = 'alerts',
  Checks = 'checks',
  NewCheck = 'checks/new',
  EditCheck = 'checks/edit',
}

export interface CheckPageParams {
  view: string;
  id: string;
}

export interface ProbePageParams {
  view?: string;
  id?: string;
}

export interface AdHocCheckResponse {
  id: string;
  tenantId: number;
  timeout: number;
  settings: Settings;
  probes: number[];
  target: string;
}
