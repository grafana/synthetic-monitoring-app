import { useEffect, useMemo, useState } from 'react';
import { config } from '@grafana/runtime';

import type { SMDataSource } from 'datasource/DataSource';

import { getDataSource } from './PluginConfigPage.utils';

export function useDatasource(): [SMDataSource | undefined, boolean] {
  const [datasource, setDatasource] = useState<SMDataSource | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDataSource().then((ds) => {
      setDatasource(ds ?? undefined);
      setIsLoading(false);
    });
  }, []);

  return useMemo(() => [datasource, isLoading], [datasource, isLoading]);
}

export interface DataSourceInfo {
  name: string;
  url: string;
  logo: string;
  type: string;
}

interface DataSourceInfoWithDataSource extends DataSourceInfo {
  dataSource: SMDataSource;
}

type DataSourceInfoList = [DataSourceInfoWithDataSource, ...DataSourceInfo[]] | [];

export function useLinkedDataSources(): {
  api: DataSourceInfoList[0];
  linked: DataSourceInfo[];
  isLoading: boolean;
} {
  const [smDatasource, isLoading] = useDatasource();
  const [list, setList] = useState<DataSourceInfoList>([]);

  useEffect(() => {
    if (smDatasource) {
      const { metrics, logs } = smDatasource.instanceSettings.jsonData;
      const linkedDataSources = Object.values(config.datasources)
        .filter((ds) => {
          return ds?.uid && [metrics?.uid, logs?.uid].includes(ds.uid);
        })
        .map((ds) => {
          return {
            name: ds.name,
            type: ds.type,
            url: `/datasources/edit/${ds.uid}/`,
            logo: ds.meta.info.logos.small,
          } as DataSourceInfo;
        });

      setList([
        {
          name: smDatasource.name,
          type: smDatasource.type,
          url: `/datasources/edit/${smDatasource.uid}/`,
          logo: smDatasource.meta.info.logos.small,
          dataSource: smDatasource,
        },
        ...linkedDataSources,
      ]);
    }
  }, [smDatasource]);

  return useMemo(() => {
    const [api, ...linked] = list;
    return { api, linked, isLoading };
  }, [list, isLoading]);
}
