import {
  DataQueryRequest,
  DataQueryResponse,
  Field,
  FieldType,
  LoadingState,
  TestDataSourceResponse,
} from '@grafana/data';
import { RuntimeDataSource } from '@grafana/scenes';

import { Check } from 'types';

type Query = { checks: Check[]; refId: string };

export class ScriptedCheckDataSource extends RuntimeDataSource {
  query({ targets }: DataQueryRequest<Query>): Promise<DataQueryResponse> {
    console.log({ targets });
    const checks = targets[0]?.checks;
    return Promise.resolve({
      state: LoadingState.Done,
      data: [
        {
          length: checks.length,
          fields: checks.reduce<Field[]>(
            (df, check) => {
              df.forEach((field) => {
                if (field.name === 'job') {
                  field.values.push(check.job);
                }
                if (field.name === 'instance') {
                  field.values.push(check.target);
                }
                if (field.name === 'probes') {
                  field.values.push(check.probes);
                }
              });
              return df;
            },
            [
              { name: 'job', type: FieldType.string, values: [] as string[], config: {} },
              { name: 'instance', type: FieldType.string, values: [] as string[], config: {} },
              { name: 'probes', type: FieldType.other, values: [] as any[], config: {} },
            ]
          ),
        },
      ],
    });
  }

  testDatasource(): Promise<TestDataSourceResponse> {
    return Promise.resolve({ status: 'success', message: 'OK' });
  }
}
