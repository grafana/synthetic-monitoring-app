import { BASIC_CHECK_LIST } from 'test/fixtures/checks';

import { ApiEntry } from 'test/handlers/types';
import { MetricDatasourceResponse } from 'datasource/responses.types';

const metrics = BASIC_CHECK_LIST.map((check) => ({
  metric: {
    instance: check.target,
    job: check.job,
  },
  value: [1598535155, '1'],
}));

const checkReachabilityQuery =
  'sum(rate(probe_all_success_sum[3h])) by (job, instance) / sum(rate(probe_all_success_count[3h])) by (job, instance)';
const checkUptimeQuery = `sum_over_time((ceil(sum by (instance, job) (increase(probe_all_success_sum[5m])) / sum by (instance, job) (increase(probe_all_success_count[5m]))))[3h:]) / count_over_time((sum by (instance, job) (increase(probe_all_success_count[5m])))[3h:])`;

export const getMetrics: ApiEntry<MetricDatasourceResponse<any>> = {
  route: '/metrics/api/v1/query',
  method: 'get',
  result: (req) => {
    const query = req.url.searchParams.get('query') || ``;

    if ([checkReachabilityQuery, checkUptimeQuery].includes(query)) {
      return {
        status: 200,
        json: {
          status: `success`,
          data: {
            result: metrics,
            resultType: 'vector',
          },
        },
      };
    }

    return {
      status: 400,
      json: {
        status: `error`,
        data: {
          result: [],
          resultType: 'vector',
        },
      },
    };
  },
};
