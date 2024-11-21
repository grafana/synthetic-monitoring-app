import { AppPluginMeta } from '@grafana/data';
import { getBackendSrv, getDataSourceSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { ProvisioningJsonData } from 'types';

import type { SMDataSource } from '../../datasource/DataSource';

export async function enablePlugin(meta: AppPluginMeta<ProvisioningJsonData>) {
  await firstValueFrom(
    getBackendSrv().fetch({
      url: `/api/plugins/${meta.id}/settings`,
      method: 'POST',
      data: {
        enabled: true,
        pinned: true,
      },
    })
  );

  window.location.reload();
}

export async function getDataSource() {
  const datasource = getDataSourceSrv()
    .getList()
    .find((ds) => ds.type === 'synthetic-monitoring-datasource');
  if (!datasource?.name) {
    return undefined;
  }

  return (await getDataSourceSrv().get(datasource?.name)) as SMDataSource;
}
