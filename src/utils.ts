import { DataSourceInstanceSettings, DataSourceSettings } from '@grafana/data';

import { WorldpingOptions } from './datasource/types';

import { config, getBackendSrv } from '@grafana/runtime';
import {
  HostedInstance,
  User,
  OrgRole,
  CheckType,
  Settings,
  IpVersion,
  HttpMethod,
  DnsRecordType,
  DnsProtocol,
} from 'types';

/**
 * Find all worldping datasources
 */
export function findWorldPingDataSources(): Array<DataSourceInstanceSettings<WorldpingOptions>> {
  return Object.values(config.datasources).filter(ds => {
    return ds.type === 'worldping-datasource';
  }) as Array<DataSourceInstanceSettings<WorldpingOptions>>;
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

export async function createNewWorldpingInstance(): Promise<DataSourceSettings> {
  return getBackendSrv().post('api/datasources', {
    name: 'Worldping',
    type: 'worldping-datasource',
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
