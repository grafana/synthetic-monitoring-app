import { DataQuery, DataSourceJsonData } from '@grafana/data';

export enum QueryType {
  Probes = 'probes',
  Checks = 'checks',
}

export interface WorldpingQuery extends DataQuery {
  queryType: QueryType;
}

export interface LinkedDatsourceInfo {
  grafanaName: string;
  hostedId: number;
}

/**
 * These are options configured for each DataSource instance
 */
export interface WorldpingOptions extends DataSourceJsonData {
  metrics: LinkedDatsourceInfo;
  logs: LinkedDatsourceInfo;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface SecureJsonData {
  accessToken?: string;
}
