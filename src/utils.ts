import { DataSourceInstanceSettings, DataSourceSettings, SelectableValue } from '@grafana/data';

import { SMOptions, DashboardInfo } from './datasource/types';

import { config, getBackendSrv } from '@grafana/runtime';
import {
  HostedInstance,
  User,
  OrgRole,
  CheckType,
  DnsRecordType,
  DnsProtocol,
  CheckFormValues,
  Settings,
  SettingsFormValues,
  PingSettingsFormValues,
  IpVersion,
  PingSettings,
  HttpSettings,
  HttpMethod,
  HttpSettingsFormValues,
  Label,
  TcpSettingsFormValues,
  TcpSettings,
  DnsSettingsFormValues,
  DnsSettings,
  DNSRRValidator,
  DnsValidationFormValue,
  ResponseMatchType,
  Check,
} from 'types';

import { CHECK_TYPE_OPTIONS } from 'components/constants';
import { SMDataSource } from 'datasource/DataSource';

/**
 * Find all synthetic-monitoring datasources
 */
export function findSMDataSources(): Array<DataSourceInstanceSettings<SMOptions>> {
  return Object.values(config.datasources).filter(ds => {
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

export function selectableValueFrom<T>(value: T, label?: string): SelectableValue<T> {
  const labelValue: unknown = value;
  return { label: label ?? (labelValue as string), value };
}

export async function createNewApiInstance(): Promise<DataSourceSettings> {
  return getBackendSrv().post('api/datasources', {
    name: 'Synthetic Monitoring',
    type: 'synthetic-monitoring-datasource',
    access: 'proxy',
    isDefault: false,
  });
}

export async function createHostedInstance(
  name: string,
  info: HostedInstance,
  key: string
): Promise<DataSourceInstanceSettings> {
  const data = {
    name,
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
    .then(d => {
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

export function checkType(settings: Settings): CheckType {
  let types = Object.keys(settings);
  if (types.length < 1) {
    return CheckType.HTTP;
  }
  return types[0] as CheckType;
}

export function defaultSettings(t: CheckType): Settings | undefined {
  switch (t) {
    case CheckType.HTTP: {
      return {
        http: {
          method: HttpMethod.GET,
          ipVersion: IpVersion.V4,
          noFollowRedirects: false,
        },
      };
    }
    case CheckType.PING: {
      return {
        ping: {
          ipVersion: IpVersion.V4,
          dontFragment: false,
        },
      };
    }
    case CheckType.DNS: {
      return {
        dns: {
          recordType: DnsRecordType.A,
          server: '8.8.8.8',
          ipVersion: IpVersion.V4,
          protocol: DnsProtocol.UDP,
          port: 53,
        },
      };
    }
    case CheckType.TCP: {
      return {
        tcp: {
          ipVersion: IpVersion.V4,
          tls: false,
        },
      };
    }
  }
}

/** Given hosted info, link to an existing instance */
export function dashboardUID(checkType: string, ds: SMDataSource): DashboardInfo | undefined {
  const dashboards = ds.instanceSettings.jsonData.dashboards;
  let target: DashboardInfo | undefined = undefined;
  for (const item of dashboards) {
    if (item.json.toLocaleLowerCase() === `sm-${checkType}.json`) {
      target = item;
    }
  }
  return target;
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
  return [...new Set(Object.keys(enumObject))];
}

// Matches a string against multiple options
export const matchStrings = (string: string, comparisons: string[]): boolean => {
  const lowerCased = string.toLowerCase();
  return comparisons.some(comparison => comparison.toLowerCase().match(lowerCased));
};

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

const getPingSettingsFormValues = (settings: Settings): PingSettingsFormValues => {
  const pingSettings = settings.ping ?? (defaultSettings(CheckType.PING) as PingSettings);
  return {
    ...pingSettings,
    ipVersion: selectableValueFrom(pingSettings.ipVersion),
  };
};

const headersToLabels = (headers: string[] | undefined): Label[] =>
  headers?.map(header => {
    const parts = header.split(':', 2);
    return {
      name: parts[0],
      value: parts[1],
    };
  }) ?? [];

const getHttpSettingsFormValues = (settings: Settings): HttpSettingsFormValues => {
  const httpSettings = settings.http ?? (defaultSettings(CheckType.HTTP) as HttpSettings);
  return {
    ...httpSettings,
    validStatusCodes: httpSettings.validStatusCodes?.map(statusCode => selectableValueFrom(statusCode)) ?? [],
    validHttpVersions: httpSettings.validHTTPVersions?.map(httpVersion => selectableValueFrom(httpVersion)) ?? [],
    method: selectableValueFrom(httpSettings.method),
    ipVersion: selectableValueFrom(httpSettings.ipVersion),
    headers: headersToLabels(httpSettings.headers),
  };
};

const getTcpSettingsFormValues = (settings: Settings): TcpSettingsFormValues => {
  const tcpSettings = settings.tcp ?? (defaultSettings(CheckType.TCP) as TcpSettings);
  return {
    ...tcpSettings,
    ipVersion: selectableValueFrom(tcpSettings.ipVersion),
  };
};

interface GetDnsValidationArgs {
  [ResponseMatchType.Answer]?: DNSRRValidator;
  [ResponseMatchType.Authority]?: DNSRRValidator;
  [ResponseMatchType.Additional]?: DNSRRValidator;
}
const getDnsValidations = (validations: GetDnsValidationArgs): DnsValidationFormValue[] =>
  Object.keys(validations).reduce<DnsValidationFormValue[]>((formValues, validationType) => {
    const responseMatch = validationType as ResponseMatchType;
    validations[responseMatch]?.failIfMatchesRegexp?.forEach(expression => {
      formValues.push({
        expression,
        inverted: false,
        responseMatch: selectableValueFrom(responseMatch),
      });
    });

    validations[responseMatch]?.failIfNotMatchesRegexp?.forEach(expression => {
      formValues.push({
        expression,
        inverted: true,
        responseMatch: selectableValueFrom(responseMatch),
      });
    });
    return formValues;
  }, []);

const getDnsSettingsFormValues = (settings: Settings): DnsSettingsFormValues => {
  const dnsSettings = settings.dns ?? (defaultSettings(CheckType.DNS) as DnsSettings);
  return {
    ...dnsSettings,
    ipVersion: selectableValueFrom(dnsSettings.ipVersion),
    protocol: selectableValueFrom(dnsSettings.protocol),
    recordType: selectableValueFrom(dnsSettings.recordType),
    validRCodes: dnsSettings.validRCodes?.map(responseCode => selectableValueFrom(responseCode)) ?? [],
    validations: getDnsValidations({
      [ResponseMatchType.Answer]: dnsSettings.validateAnswerRRS,
      [ResponseMatchType.Authority]: dnsSettings.validateAuthorityRRS,
      [ResponseMatchType.Additional]: dnsSettings.validateAdditionalRRS,
    }),
  };
};

const getFormSettingsForCheck = (settings: Settings): SettingsFormValues => {
  const type = checkType(settings);
  switch (type) {
    case CheckType.HTTP:
      return { http: getHttpSettingsFormValues(settings) };
    case CheckType.TCP:
      return { tcp: getTcpSettingsFormValues(settings) };
    case CheckType.DNS:
      return { dns: getDnsSettingsFormValues(settings) };
    case CheckType.PING:
    default:
      return { ping: getPingSettingsFormValues(settings) };
  }
};

export const getDefaultValuesFromCheck = (check: Check): CheckFormValues => {
  const defaultCheckType = checkType(check.settings);
  return {
    ...check,
    timeout: check.timeout / 1000,
    frequency: check.frequency / 1000,
    checkType:
      CHECK_TYPE_OPTIONS.find(checkTypeOption => checkTypeOption.value === defaultCheckType) ?? CHECK_TYPE_OPTIONS[1],
    settings: getFormSettingsForCheck(check.settings),
  };
};
