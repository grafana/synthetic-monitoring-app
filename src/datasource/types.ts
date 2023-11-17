import { DataQuery, DataSourceJsonData, VariableModel } from '@grafana/data';

import { Check } from 'types';

export enum QueryType {
  Probes = 'probes',
  Checks = 'checks',
  Traceroute = 'traceroute',
  ScriptedChecks = 'scriptedChecks',
}

export interface SMQuery extends DataQuery {
  queryType: QueryType;
  instance?: string;
  job?: string;
  probe?: string;
  checks?: Check[];
  query: string;
}

export const defaultQuery: SMQuery = {
  queryType: QueryType.Probes,
} as SMQuery;

export interface LinkedDatasourceInfo {
  grafanaName: string;
  hostedId: number;
  uid?: string;
}

export interface DashboardInfo {
  title: string;
  uid: string;
  json: string;
  version: number;
  latestVersion?: number;
}

export interface FolderInfo {
  title: string;
  uid: string;
  id: number;
}

/**
 * These are options configured for each DataSource instance
 */
export interface SMOptions extends DataSourceJsonData {
  apiHost: string;
  metrics: LinkedDatasourceInfo;
  initialized?: boolean;
  logs: LinkedDatasourceInfo;
  dashboards: DashboardInfo[];
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface SecureJsonData {
  accessToken?: string;
}

export interface LogStream {
  ElapsedTime: string;
  Hosts: string;
  Success: string;
  TTL: string;
  TracerouteID: string;
  LossPercent: string;
  Destination: string;
  check_name: string;
  instance: string;
  job: string;
  probe: string;
  probe_success: string;
  region: string;
  source: string;
  target: string;
}

export interface ParsedLogStream extends Omit<LogStream, 'TTL' | 'Hosts'> {
  TTL: number;
  Hosts: string[];
}

export interface LogLine {
  stream: LogStream;
  values: string[];
}

export interface LogQueryResponse {
  data: LogLine[];
  error?: string;
}

export interface LogsAggregatedByTrace {
  [key: string]: ParsedLogStream[];
}

export interface ParsedTraceHost {
  nextHosts?: Set<string>;
  elapsedTimes: string[];
  isStart: boolean;
  isMostRecent: boolean;
  packetLossAverages: number[];
  TTL: number;
}

export interface TracesByHost {
  [key: string]: ParsedTraceHost;
}

export enum AccountingClassNames {
  dns = 'dns',
  dns_basic = 'dns_basic',
  http = 'http',
  http_basic = 'http_basic',
  http_ssl = 'http_ssl',
  http_ssl_basic = 'http_ssl_basic',
  ping = 'ping',
  ping_basic = 'ping_basic',
  tcp = 'tcp',
  tcp_basic = 'tcp_basic',
  tcp_ssl = 'tcp_ssl',
  tcp_ssl_basic = 'tcp_ssl_basic',
  traceroute = 'traceroute',
  traceroute_basic = 'traceroute_basic',
  multihttp_basic = 'multihttp_basic',
}

interface AccountingClass {
  CheckType: number;
  Series: number;
}

export type CheckAccountingClasses = {
  [key in AccountingClassNames]: AccountingClass;
};

export interface CheckInfo {
  AccountingClasses: CheckAccountingClasses;
}

interface CurrentVariableModel {
  value: string | undefined;
}

export interface DashboardVariable extends VariableModel {
  current?: CurrentVariableModel;
}
