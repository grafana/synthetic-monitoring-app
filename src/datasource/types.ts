import { DataQuery, DataSourceJsonData } from '@grafana/data';

export enum QueryType {
  Probes = 'probes',
  Checks = 'checks',
}

export interface WorldpingQuery extends DataQuery {
  queryType: QueryType;
}

export const defaultQuery: WorldpingQuery = {
  queryType: QueryType.Probes,
} as WorldpingQuery;

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
export interface WorldpingOptions extends DataSourceJsonData {
  apiHost: string;
  metrics: LinkedDatsourceInfo;
  logs: LinkedDatsourceInfo;
  dashboards: DashboardInfo[];
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface SecureJsonData {
  accessToken?: string;
}
