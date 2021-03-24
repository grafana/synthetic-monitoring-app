import { DataQuery, DataSourceJsonData } from '@grafana/data';

export enum QueryType {
  Probes = 'probes',
  Checks = 'checks',
  Traceroute = 'traceroute',
}

export interface SMQuery extends DataQuery {
  queryType: QueryType;
}

export const defaultQuery: SMQuery = {
  queryType: QueryType.Probes,
} as SMQuery;

export interface LinkedDatsourceInfo {
  grafanaName: string;
  hostedId: number;
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
  metrics: LinkedDatsourceInfo;
  initialized?: boolean;
  logs: LinkedDatsourceInfo;
  dashboards: DashboardInfo[];
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface SecureJsonData {
  accessToken?: string;
}

export interface CloudDatasourceJsonData extends DataSourceJsonData {
  directUrl: string;
}

export interface LogStream {
  ElapsedTime: string;
  Host: string;
  Success: string;
  TTL: string;
  TraceID: string;
  check_name: string;
  instance: string;
  job: string;
  probe: string;
  probe_success: string;
  region: string;
  source: string;
  target: string;
}

export interface ParsedLogStream extends Omit<LogStream, 'TTL'> {
  TTL: number;
}

export interface LogLine {
  stream: LogStream;
  values: string[];
}

export interface LogQueryResponse {
  data: LogLine[];
}

export interface LogsAggregatedByTrace {
  [key: string]: ParsedLogStream[];
}

export interface ParsedTraceHost {
  nextHosts?: Set<string>;
  elapsedTimes: string[];
}

export interface TracesByHost {
  [key: string]: ParsedTraceHost;
}
