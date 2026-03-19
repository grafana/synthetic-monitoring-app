import { type QueryKey, useQuery } from '@tanstack/react-query';

import { AlertSensitivity, Check } from 'types';
import { InstantMetric } from 'datasource/responses.types';
import { getStartEnd, queryInstantMetric } from 'data/utils';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { STANDARD_REFRESH_INTERVAL } from 'components/constants';

const FIRING_ALERTS_QUERY =
  'max by (job, instance, alertname) (ALERTS{namespace="synthetic_monitoring", alertstate="firing"} or GRAFANA_ALERTS{namespace="synthetic_monitoring", alertstate="firing"})';

const QUERY_KEYS: Record<'checkAlertStates', QueryKey> = {
  checkAlertStates: ['check_alert_states'],
};

type MetricCheckAlertState = InstantMetric & {
  metric: {
    alertname: string;
    instance: string;
    job: string;
  };
};

export interface CheckRuntimeAlertState {
  firingCount: number;
  isFiring: boolean;
}

export type CheckRuntimeAlertStates = Record<string, CheckRuntimeAlertState>;

const EMPTY_ALERT_STATE: CheckRuntimeAlertState = {
  firingCount: 0,
  isFiring: false,
};

export function getCheckRuntimeAlertStateKey(job: Check['job'], target: Check['target']) {
  return JSON.stringify([job, target]);
}

export function getCheckRuntimeAlertState(
  checkAlertStates: CheckRuntimeAlertStates,
  { job, target }: Pick<Check, 'job' | 'target'>
) {
  return checkAlertStates[getCheckRuntimeAlertStateKey(job, target)] ?? EMPTY_ALERT_STATE;
}

export function useChecksAlertStates(checks: Check[]) {
  const metricsDS = useMetricsDS();
  const url = metricsDS?.url || '';
  const hasAlertingChecks = checks.some((check) => {
    const hasPerCheckAlerts = (check.alerts?.length ?? 0) > 0;
    const hasAlertSensitivity = check.alertSensitivity !== undefined && check.alertSensitivity !== AlertSensitivity.None;

    return hasPerCheckAlerts || hasAlertSensitivity;
  });

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [...QUERY_KEYS.checkAlertStates, url],
    queryFn: () => {
      if (!metricsDS) {
        return Promise.reject(`You need to have a metrics datasource available.`);
      }

      return queryInstantMetric<MetricCheckAlertState>({ url, query: FIRING_ALERTS_QUERY, ...getStartEnd() });
    },
    refetchInterval: () => STANDARD_REFRESH_INTERVAL,
    select: (data) => {
      return data.reduce<CheckRuntimeAlertStates>((acc, metric) => {
        const key = getCheckRuntimeAlertStateKey(metric.metric.job, metric.metric.instance);
        const current = acc[key] ?? EMPTY_ALERT_STATE;

        acc[key] = {
          firingCount: current.firingCount + 1,
          isFiring: true,
        };

        return acc;
      }, {});
    },
    enabled: Boolean(metricsDS) && hasAlertingChecks,
  });
}
