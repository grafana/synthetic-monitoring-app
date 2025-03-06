import { AppEvents } from '@grafana/data';
import { FetchResponse, getBackendSrv, isFetchError } from '@grafana/runtime';
import appEvents from 'grafana/app/core/app_events';
import { firstValueFrom } from 'rxjs';

import { Check } from 'types';
import { InstantMetric, MetricCheckSuccess, MetricDatasourceResponse, RangeMetric } from 'datasource/responses.types';
const severityMapping = {
  success: AppEvents.alertSuccess,
  warning: AppEvents.alertWarning,
  error: AppEvents.alertError,
};

export const showAlert = (severity: keyof typeof severityMapping = 'success', message: string) => {
  appEvents.emit(severityMapping[severity], [message]);
};

export function findCheckinMetrics<T extends MetricCheckSuccess>(metrics: T[], checkToFind: Check) {
  return metrics.find((entry) => entry.metric.instance === checkToFind.target && entry.metric.job === checkToFind.job);
}

export function constructError(desc: string, error: unknown) {
  if (isFetchError(error)) {
    return `${error.status}: ${desc} - ${error.statusText}`;
  }

  if (error instanceof Error) {
    return `${desc} - ${error.message}`;
  }

  return desc;
}

interface InstantMetricQueryOptions {
  url: string;
  query: string;
  start: number;
  end: number;
}

interface RangeMetricQueryOptions extends InstantMetricQueryOptions {
  step: string;
}

export function queryInstantMetric<T extends InstantMetric>({ url, query, start, end }: InstantMetricQueryOptions) {
  return firstValueFrom(
    getBackendSrv().fetch<MetricDatasourceResponse<T>>({
      method: 'GET',
      url: `${url}/api/v1/query`,
      params: {
        query,
        end,
        start,
      },
    })
  ).then((res: FetchResponse<MetricDatasourceResponse<T>>) => {
    return res.data.data.result.map((metric) => {
      return {
        ...metric,
        value: [metric.value[0], Number(metric.value[1])] as [number, number],
      };
    });
  });
}

export function queryRangeMetric<T extends RangeMetric>({ url, query, start, end, step }: RangeMetricQueryOptions) {
  return firstValueFrom(
    getBackendSrv().fetch<MetricDatasourceResponse<T>>({
      method: 'GET',
      url: `${url}/api/v1/query_range`,
      params: {
        query,
        end,
        start,
        step,
      },
    })
  ).then((res: FetchResponse<MetricDatasourceResponse<T>>) => {
    return res.data.data.result.map((metric) => {
      const result: T & { values: Array<[number, number]> } = {
        ...metric,
        values: metric.values.map(([time, value]) => [time * 1000, Number(value)]),
      };

      return result;
    });
  });
}

export function getStartEnd() {
  const now = Math.floor(Date.now() / 1000);
  const THREE_HOURS_AGO = now - 60 * 60 * 3;

  return {
    start: THREE_HOURS_AGO,
    end: now,
  };
}
