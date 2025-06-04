import { type QueryKey, useQuery } from '@tanstack/react-query';
import { getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { Check, PrometheusAlertsGroup } from 'types';
import { ListPrometheusAlertsResponse } from 'datasource/responses.types';

import { constructError, showAlert } from './utils';

export const queryKeys: Record<'list', QueryKey> = {
  list: ['alerts'],
};

export function useGMAlerts() {
  return useQuery({
    queryKey: [...queryKeys.list],
    queryFn: () => {
      return queryAlertApi();
    },
  });
}

function queryAlertApi() {
  return firstValueFrom(
    getBackendSrv().fetch<ListPrometheusAlertsResponse>({
      method: `GET`,
      url: `/api/prometheus/grafana/api/v1/rules`,
      showErrorAlert: false,
    })
  )
    .then((res) => {
      return res.data.data;
    })
    .catch((error) => {
      const err = constructError(`Unable to fetch alert rules`, error);
      showAlert('error', err);
      throw error;
    });
}

export function findRelevantAlertGroups(groups: PrometheusAlertsGroup[], alerts: Check['alerts']) {
  const alertNames = alerts?.map((alert: { name: string }) => alert.name);

  return groups
    .filter((group) => group.folderUid === 'grafana-synthetic-monitoring-app')
    .reduce<PrometheusAlertsGroup[]>((acc, current) => {
      const relevantRules = current.rules.filter((rule) =>
        alertNames?.some((alertName) => rule.name.includes(alertName))
      );

      if (relevantRules.length) {
        return [...acc, { ...current, rules: relevantRules }];
      }

      return acc;
    }, []);
}
