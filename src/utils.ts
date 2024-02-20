import { DataSourceInstanceSettings, OrgRole, TimeRange } from '@grafana/data';
import { config, FetchResponse, getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { DashboardInfo, LinkedDatasourceInfo, LogQueryResponse, LogStream, SMOptions } from './datasource/types';
import { CheckType, HostedInstance, Probe, Settings, SubmissionErrorWrapper, ThresholdValues } from 'types';
import { SMDataSource } from 'datasource/DataSource';
import { Metric } from 'datasource/responses.types';

/**
 * Find all synthetic-monitoring datasources
 */
export function findSMDataSources(): Array<DataSourceInstanceSettings<SMOptions>> {
  return Object.values(config.datasources).filter((ds) => {
    return ds.type === 'synthetic-monitoring-datasource';
  }) as unknown as Array<DataSourceInstanceSettings<SMOptions>>;
}

export function findLinkedDatasource(linkedDSInfo: LinkedDatasourceInfo): DataSourceInstanceSettings | undefined {
  if (linkedDSInfo.uid) {
    const linkedDS = Object.values(config.datasources).find((ds) => ds.uid === linkedDSInfo.uid);
    if (linkedDS) {
      return linkedDS;
    }
  }
  return config.datasources[linkedDSInfo.grafanaName];
}

interface DatasourcePayload {
  accessToken: string;
  apiHost: string;
  metrics: LinkedDatasourceInfo;
  logs: LinkedDatasourceInfo;
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
  const user = config.bootData.user;
  switch (requiredRole) {
    case OrgRole.Admin: {
      return user.orgRole === OrgRole.Admin;
    }
    case OrgRole.Editor: {
      return user.orgRole === OrgRole.Admin || user.orgRole === OrgRole.Editor;
    }
    case OrgRole.Viewer: {
      return user.orgRole === OrgRole.Admin || user.orgRole === OrgRole.Editor || user.orgRole === OrgRole.Viewer;
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
export function enumToStringArray(enumObject: {}) {
  const set = new Set(Object.keys(enumObject) as string[]);
  return Array.from(set);
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

interface MetricDatasourceResponse<T> {
  data: {
    result: T[];
    resultType: string;
  };
}

export interface MetricQueryOptions {
  start: number;
  end: number;
  step: number;
}

export const queryMetric = async <T extends Metric>(url: string, query: string, options?: MetricQueryOptions) => {
  const lastUpdate = Math.floor(Date.now() / 1000);
  const params = {
    query,
    time: lastUpdate,
    ...(options || {}),
  };

  const path = options?.step ? '/api/v1/query_range' : '/api/v1/query';

  return firstValueFrom(
    getBackendSrv().fetch<MetricDatasourceResponse<T>>({
      method: 'GET',
      url: `${url}${path}`,
      params,
    })
  ).then((res: FetchResponse<MetricDatasourceResponse<T>>) => {
    return res.data.data.result.map((metric) => {
      return {
        ...metric,
        value: [metric.value[0], Number(metric.value[1])] as [number, number],
      };
    });
  });
};

export const queryLogsLegacy = async (
  url: string,
  query: string,
  start: number,
  end: number
): Promise<LogQueryResponse> => {
  const backendSrv = getBackendSrv();
  const params = {
    direction: 'BACKWARD',
    limit: 1000,
    query,
    start: start,
    end: end,
    // step: ,
  };

  try {
    const response = await backendSrv.datasourceRequest({
      method: 'GET',
      url: `${url}/loki/api/v1/query`,
      params,
    });
    return {
      data: response.data?.data?.result ?? [],
    };
  } catch (e) {
    const err = e as SubmissionErrorWrapper;
    return { error: (err.message || err.data?.message) ?? 'Error fetching data', data: [] };
  }
};

export async function queryLogs(dsUid: string, expr: string, range: TimeRange) {
  const resp = await getBackendSrv().post('/api/ds/query', {
    queries: [
      {
        refId: 'A',
        datasource: { type: 'loki', uid: dsUid },
        expr,
        queryType: 'range',
        maxLines: 1000,
        legendFormat: '',
        intervalMs: 2000,
        maxDataPoints: 1440,
      },
    ],
    range,
    from: range.from,
    to: range.to,
  });

  const logLines = resp.results['A'].frames[0].data.values[0] as LogStream[];
  return logLines;
}

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

export const getSuccessRateThresholdColor = (thresholds: ThresholdValues, value: number) => {
  const { upperLimit, lowerLimit } = thresholds;
  const { success, error, warning } = config.theme2.colors;

  if (value > upperLimit) {
    return success.main;
  }

  if (value > lowerLimit && value < upperLimit) {
    return warning.main;
  }

  return error.shade;
};

export const getLatencySuccessRateThresholdColor = (thresholds: ThresholdValues, value: number) => {
  const { lowerLimit, upperLimit } = thresholds;
  const { success, error, warning } = config.theme2.colors;

  if (value < lowerLimit) {
    return success.main;
  }

  if (value > lowerLimit && value < upperLimit) {
    return warning.main;
  }

  return error.shade;
};

export function getRandomProbes(probes: number[], quantity: number): number[] {
  if (quantity >= probes.length) {
    return probes;
  }
  const randomProbes = new Set([] as number[]);
  while (randomProbes.size < quantity) {
    const index = Math.floor(Math.random() * probes.length);
    randomProbes.add(probes[index]);
  }
  return Array.from(randomProbes).sort((a, b) => a - b);
}

export function canEditProbes(probe?: Probe) {
  if (!probe || probe.public) {
    return false;
  }

  return hasRole(OrgRole.Editor);
}

export function formatDate(number: number) {
  return new Date(number).toLocaleString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
