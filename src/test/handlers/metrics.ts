import { ApiEntry } from 'test/handlers/types';
import { MetricDatasourceResponse } from 'datasource/responses.types';

export const getMetrics: ApiEntry<MetricDatasourceResponse<any>> = {
  route: '/api/v1/metrics',
  method: 'get',
  result: (req) => {
    return {
      status: 200,
      json: {
        status: `success`,
        data: {
          result: [
            {
              metric: {
                job: 'burritos',
                instance: 'tacos',
              },
              value: [],
            },
          ],
          resultType: 'vector',
        },
      },
    };
  },
};
