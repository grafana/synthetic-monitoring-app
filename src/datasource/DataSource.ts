import { DataQueryRequest, DataQueryResponse, DataSourceApi, DataSourceInstanceSettings, FieldType, ArrayDataFrame, DataFrame } from '@grafana/data';

import { WorldpingQuery, WorldpingOptions, QueryType } from './types';

import { getBackendSrv } from '@grafana/runtime';
import { Probe, Check } from 'types';

export class DataSource extends DataSourceApi<WorldpingQuery, WorldpingOptions> {
  constructor(private instanceSettings: DataSourceInstanceSettings<WorldpingOptions>) {
    super(instanceSettings);
  }

  async query(options: DataQueryRequest<WorldpingQuery>): Promise<DataQueryResponse> {
    const data: DataFrame[] = [];
    for (const query of options.targets) {
      if (query.queryType === QueryType.Probes) {
        const probes = await this.listProbes();
        const frame = new ArrayDataFrame(probes);
        frame.setFieldType('onelineChange', FieldType.time, (s: number) => s * 1000); // seconds to ms
        frame.setFieldType('created', FieldType.time, (s: number) => s * 1000); // seconds to ms
        frame.setFieldType('updated', FieldType.time, (s: number) => s * 1000); // seconds to ms
        frame.refId = query.refId;
        data.push(frame);
      } else if (query.queryType === QueryType.Checks) {
        const checks = await this.listChecks();
        const frame = new ArrayDataFrame(checks);
        frame.setFieldType('created', FieldType.time, (s: number) => s * 1000); // seconds to ms
        frame.setFieldType('updated', FieldType.time, (s: number) => s * 1000); // seconds to ms
        frame.refId = query.refId;
        data.push(frame);
      }
    }
    return { data };
  }

  listProbes(): Promise<Probe[]> {
    return getBackendSrv()
      .datasourceRequest({
        method: 'GET',
        url: `${this.instanceSettings.url}/dev/probe/list`,
      })
      .then((res: any) => {
        return res.data;
      });
  }

  listChecks(): Promise<Check[]> {
    return getBackendSrv()
      .datasourceRequest({
        method: 'GET',
        url: `${this.instanceSettings.url}/dev/check/list`,
      })
      .then((res: any) => {
        return res.data;
      });
  }

  async testDatasource() {
    console.log('TEST', this.instanceSettings);

    // Implement
    return this.query({
      targets: [
        {
          refId: 'A',
          queryType: QueryType.Probes,
        },
      ],
    } as DataQueryRequest<WorldpingQuery>);
  }
}

export function getTableRows(data: DataFrame): any[] {
  const tableData = [];

  for (let i = 0; i < data.length; i++) {
    const row: { [key: string]: string | number } = {};
    for (let j = 0; j < data.fields.length; j++) {
      const prop = data.fields[j].name;
      row[prop] = data.fields[j].values.get(i);
    }
    tableData.push(row);
  }

  return tableData;
}
