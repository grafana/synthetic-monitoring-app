import { BASIC_CHECK_LIST } from 'test/fixtures/checks';
import { METRICS_DATASOURCE } from 'test/fixtures/datasources';

import { ApiEntry } from 'test/handlers/types';
import { MetricDatasourceResponse } from 'datasource/responses.types';

const instantMetrics = BASIC_CHECK_LIST.map((check) => ({
  metric: {
    instance: check.target,
    job: check.job,
  },
  value: [1598535155, '1'],
}));

const rangeMetrics = BASIC_CHECK_LIST.map((check) => ({
  metric: {
    instance: check.target,
    job: check.job,
  },
  value: [[1598535155, '1']],
}));

const checkReachabilityQuery =
  'sum(rate(probe_all_success_sum[3h])) by (job, instance) / sum(rate(probe_all_success_count[3h])) by (job, instance)';
const checkUptimeQuery = `clamp_max(sum(max_over_time(probe_success{job=`;

export const getInstantMetrics: ApiEntry<MetricDatasourceResponse<any>> = {
  route: `${METRICS_DATASOURCE.url}/api/v1/query`,
  method: 'get',
  result: (req) => {
    const query = req.url.searchParams.get('query') || ``;

    if ([checkReachabilityQuery, checkUptimeQuery].includes(query)) {
      return {
        status: 200,
        json: {
          status: `success`,
          data: {
            result: instantMetrics,
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

export const getRangeMetrics: ApiEntry<MetricDatasourceResponse<any>> = {
  route: `${METRICS_DATASOURCE.url}/api/v1/query_range`,
  method: 'get',
  result: (req) => {
    const query = req.url.searchParams.get('query') || ``;

    if ([checkReachabilityQuery, checkUptimeQuery].includes(query)) {
      return {
        status: 200,
        json: {
          status: `success`,
          data: {
            result: rangeMetrics,
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
