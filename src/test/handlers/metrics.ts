import { BASIC_CHECK_LIST } from 'test/fixtures/checks';
import { METRICS_DATASOURCE } from 'test/fixtures/datasources';

import { ApiEntry } from 'test/handlers/types';
import { MetricDatasourceResponse } from 'datasource/responses.types';
import { DEFAULT_QUERY_FROM_TIME } from 'components/constants';

const INSTANT_METRICS = BASIC_CHECK_LIST.map((check) => ({
  metric: {
    instance: check.target,
    job: check.job,
  },
  value: [1598535155, '1'],
}));

const RANGE_METRICS = BASIC_CHECK_LIST.map((check) => ({
  metric: {
    instance: check.target,
    job: check.job,
  },
  value: [[1598535155, '1']],
}));

const CHECK_REACHABILITY_QUERY =
  `sum(rate(probe_all_success_sum[${DEFAULT_QUERY_FROM_TIME}])) by (job, instance) / sum(rate(probe_all_success_count[${DEFAULT_QUERY_FROM_TIME}])) by (job, instance)`;
const CHECK_UPTIME_QUERY = `clamp_max(sum(max_over_time(probe_success{job=`;

export const getInstantMetrics: ApiEntry<MetricDatasourceResponse<any>> = {
  route: `${METRICS_DATASOURCE.url}/api/v1/query`,
  method: 'get',
  result: (req) => {
    const url = new URL(req.url);
    const query = url.searchParams.get('query') || ``;

    if ([CHECK_REACHABILITY_QUERY, CHECK_UPTIME_QUERY].includes(query)) {
      return {
        status: 200,
        json: {
          status: `success`,
          data: {
            result: INSTANT_METRICS,
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
    const url = new URL(req.url);
    const query = url.searchParams.get('query') || ``;

    if ([CHECK_REACHABILITY_QUERY, CHECK_UPTIME_QUERY].includes(query)) {
      return {
        status: 200,
        json: {
          status: `success`,
          data: {
            result: RANGE_METRICS,
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
