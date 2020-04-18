//import defaults from 'lodash/defaults';

import { DataQueryRequest, DataQueryResponse, DataSourceApi, DataSourceInstanceSettings, MutableDataFrame, FieldType } from '@grafana/data';

import { WorldpingQuery, WorldpingOptions, QueryType } from './types';

import { getBackendSrv } from '@grafana/runtime';

export class DataSource extends DataSourceApi<WorldpingQuery, WorldpingOptions> {
  constructor(private instanceSettings: DataSourceInstanceSettings<WorldpingOptions>) {
    super(instanceSettings);
  }

  async query(options: DataQueryRequest<WorldpingQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();

    console.log(this.instanceSettings, options);

    return getBackendSrv()
      .datasourceRequest({
        url: `${this.instanceSettings.url}/dev/x`,
      })
      .then((res: any) => {
        const frame = new MutableDataFrame({
          refId: 'A',
          fields: [
            { name: 'Time', values: [from, to], type: FieldType.time },
            { name: 'Value', values: [7, 8], type: FieldType.number },
          ],
        });
        return { data: [frame] };
      });
  }

  async testDatasource() {

    console.log( 'TEST', this.instanceSettings );

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
