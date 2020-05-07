import { DataSourceInstanceSettings, DataSourceSettings } from '@grafana/data';

import { WorldpingOptions } from './datasource/types';

import { config, getBackendSrv } from '@grafana/runtime';
import { HostedInstance } from 'types';

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
    const instanceUrl = info.url + (info.type === 'logs' ? '/loki/api/v1' : '/api/prom');
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
    url: info.url + (info.type === 'logs' ? '/loki/api/v1' : '/api/prom'),
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
