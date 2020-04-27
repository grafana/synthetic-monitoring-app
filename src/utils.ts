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
export function findHostedInstance(info: HostedInstance): DataSourceInstanceSettings | undefined {
  for (const ds of Object.values(config.datasources)) {
    if (info.url === ds.url) {
      console.log('Consider', info, ds);
    }
  }
  return undefined;
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
): Promise<DataSourceSettings> {
  const data = {
    name,
    url: info.url,
    access: 'proxy',
    basicAuth: true,
    basicAuthUser: `${info.id}`,
    secureJsonData: {
      basicAuthPassword: key,
    },
    type: info.type === 'logs' ? 'loki' : 'prometheus',
  };
  return getBackendSrv().post('api/datasources', data);
}
