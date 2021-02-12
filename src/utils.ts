import { DataSourceInstanceSettings } from '@grafana/data';

import { SMOptions, DashboardInfo, LinkedDatsourceInfo } from './datasource/types';

import { config, getBackendSrv } from '@grafana/runtime';
import { HostedInstance, User, OrgRole, CheckType, Settings } from 'types';

import { SMDataSource } from 'datasource/DataSource';

/**
 * Find all synthetic-monitoring datasources
 */
export function findSMDataSources(): Array<DataSourceInstanceSettings<SMOptions>> {
  return Object.values(config.datasources).filter((ds) => {
    return ds.type === 'synthetic-monitoring-datasource';
  }) as Array<DataSourceInstanceSettings<SMOptions>>;
}

/** Given hosted info, link to an existing instance */
export function findHostedInstance(
  known: DataSourceInstanceSettings[],
  info?: HostedInstance
): DataSourceInstanceSettings | undefined {
  if (info) {
    const basicAuthUser = `${info.id}`;
    const instanceUrl = info.url + (info.type === 'logs' ? '' : '/api/prom');
    for (const ds of known) {
      if (ds.url === instanceUrl) {
        console.log('MAYBE:', basicAuthUser, (ds as any).basicAuthUser, ds);
        if (basicAuthUser === (ds as any).basicAuthUser) {
          return ds;
        }
      }
    }
  }
  return undefined;
}

/** Given hosted info, link to an existing instance */
export async function getHostedLokiAndPrometheusInfo(): Promise<DataSourceInstanceSettings[]> {
  const settings: DataSourceInstanceSettings[] = [];
  for (const ds of Object.values(config.datasources)) {
    if (ds.type === 'prometheus' || ds.type === 'loki') {
      const s = await getBackendSrv().get(`api/datasources/${ds.id}`);
      if (s.url && s.url.indexOf('grafana.net') > 0) {
        settings.push(s as DataSourceInstanceSettings);
      }
    }
  }
  return settings;
}

export async function createDatasource(hosted: HostedInstance, adminToken: string, smDatasourceId: string) {
  const token = await getViewerToken(adminToken, hosted, smDatasourceId);
  if (!token) {
    throw new Error('error getting token');
  }
  return await createHostedInstance(hosted, token);
}

async function getViewerToken(apiToken: string, instance: HostedInstance, smDatasourceId: string): Promise<string> {
  return getBackendSrv()
    .datasourceRequest({
      method: 'POST',
      url: `api/datasources/proxy/${smDatasourceId}/viewer-token`,
      data: {
        apiToken,
        id: instance.id,
        type: instance.type,
      },
      headers: {
        // ensure the grafana backend doesn't use a cached copy of the
        // datasource config, as it might not have the new apiHost set.
        'X-Grafana-NoCache': 'true',
      },
    })
    .then((res: any) => {
      return res.data?.token;
    });
}

interface DatasourcePayload {
  accessToken: string;
  apiHost: string;
  metrics: LinkedDatsourceInfo;
  logs: LinkedDatsourceInfo;
}

// Used for stubbing out the datasource when plugin is not provisioned

export async function createNewApiInstance(
  payload: DatasourcePayload,
  dashboards: DashboardInfo[]
): Promise<SMOptions> {
  return getBackendSrv().post('api/datasources', {
    name: 'Synthetic Monitoring',
    type: 'synthetic-monitoring-datasource',
    access: 'proxy',
    isDefault: false,
    jsonData: {
      apiHost: payload.apiHost,
      dashboards,
      initialized: true,
      metrics: payload.metrics,
      logs: payload.logs,
    },
    secureJsonData: {
      accessToken: payload.accessToken,
    },
  });
}

export async function initializeDatasource(
  datasourcePayload: DatasourcePayload,
  dashboards: DashboardInfo[]
): Promise<SMOptions> {
  const existingDatasource = findSMDataSources()?.[0];
  if (existingDatasource) {
    return getBackendSrv().put(`api/datasources/${existingDatasource.id}`, {
      ...existingDatasource,
      access: 'proxy',
      isDefault: false,
      secureJsonData: {
        accessToken: datasourcePayload.accessToken,
      },
      jsonData: {
        apiHost: datasourcePayload.apiHost,
        initialized: true,
        dashboards,
        metrics: datasourcePayload.metrics,
        logs: datasourcePayload.logs,
      },
    });
  }
  return createNewApiInstance(datasourcePayload, dashboards);
}

export async function createHostedInstance(info: HostedInstance, key: string): Promise<DataSourceInstanceSettings> {
  const data = {
    name: `grafanacloud-${info.name}`,
    url: info.url + (info.type === 'logs' ? '' : '/api/prom'),
    access: 'proxy',
    basicAuth: true,
    basicAuthUser: `${info.id}`,
    secureJsonData: {
      basicAuthPassword: key,
    },
    type: info.type === 'logs' ? 'loki' : 'prometheus',
  };
  return getBackendSrv()
    .post('api/datasources', data)
    .then((d) => {
      return d.datasource;
    });
}

export function hasRole(requiredRole: OrgRole): boolean {
  const user: User = config.bootData.user;
  switch (requiredRole) {
    case OrgRole.ADMIN: {
      return user.orgRole === OrgRole.ADMIN;
    }
    case OrgRole.EDITOR: {
      return user.orgRole === OrgRole.ADMIN || user.orgRole === OrgRole.EDITOR;
    }
    case OrgRole.VIEWER: {
      return user.orgRole === OrgRole.ADMIN || user.orgRole === OrgRole.EDITOR || user.orgRole === OrgRole.VIEWER;
    }
    default: {
      return false;
    }
  }
}

/** Given hosted info, link to an existing instance */
export function dashboardUID(checkType: string, ds?: SMDataSource): DashboardInfo | undefined {
  const dashboards = ds?.instanceSettings?.jsonData?.dashboards;
  return dashboards?.find((item) => item.json.toLocaleLowerCase() === `sm-${checkType}.json`);
}

export const parseUrl = (url: string) => {
  try {
    return new URL(url);
  } catch (e) {
    return;
  }
};

// Takes a TS enum with matching string/value pairs and transforms it into an array of strings
// Under the hood TS enums duplicate key/value pairs so a value can match a key and vice-versa
export function enumToStringArray<T>(enumObject: T) {
  return [...new Set(Object.keys(enumObject) as string[])];
}

// Matches a string against multiple options
export const matchStrings = (string: string, comparisons: string[]): boolean => {
  const lowerCased = string.toLowerCase();
  return comparisons.some((comparison) => comparison.toLowerCase().match(lowerCased));
};

export function checkType(settings: Settings): CheckType {
  let types = Object.keys(settings);
  if (types.length < 1) {
    return CheckType.HTTP;
  }
  return types[0] as CheckType;
}

interface MetricQueryResponse {
  error?: string;
  data: any[];
}

export interface MetricQueryOptions {
  start: number;
  end: number;
  step: number;
}

export const queryMetric = async (
  url: string,
  query: string,
  options?: MetricQueryOptions
): Promise<MetricQueryResponse> => {
  const backendSrv = getBackendSrv();
  const lastUpdate = Math.floor(Date.now() / 1000);
  const params = {
    query,
    time: lastUpdate,
    ...(options || {}),
  };

  const path = options?.step ? '/api/v1/query_range' : '/api/v1/query';

  try {
    const response = await backendSrv.datasourceRequest({
      method: 'GET',
      url: `${url}${path}`,
      params,
    });
    if (!response.ok) {
      return { error: 'Error fetching data', data: [] };
    }
    return {
      data: response.data?.data?.result ?? [],
    };
  } catch (e) {
    return { error: (e.message || e.data?.message) ?? 'Error fetching data', data: [] };
  }
};

export const toBase64 = (value: string) => {
  try {
    return btoa(value);
  } catch {
    return value;
  }
};

export const fromBase64 = (value: string) => {
  try {
    return atob(value);
  } catch {
    return value;
  }
};
