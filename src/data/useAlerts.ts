import { useContext } from 'react';
import { type QueryKey, useQuery } from '@tanstack/react-query';
import { DataSourceSettings } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { AlertFilter, PrometheusAlertRecord, PrometheusAlertsGroup } from 'types';
import { ListPrometheusAlertsResponse } from 'datasource/responses.types';
import { InstanceContext } from 'contexts/InstanceContext';

import { constructError, showAlert } from './utils';

export const queryKeys: Record<'list', QueryKey> = {
  list: ['alerts'],
};

const alertFilter = (alert: PrometheusAlertRecord) => {
  return alert.query.includes(`alert_sensitivity`);
};

export function useAlerts() {
  const { instance } = useContext(InstanceContext);
  const metrics = instance.metrics as DataSourceSettings;

  return useQuery({
    queryKey: [...queryKeys.list, metrics.uid],
    queryFn: () => {
      return queryAlertApi(metrics.uid);
    },
    select: (data) => {
      return findRelevantAlertGroups(data.groups, alertFilter);
    },
  });
}

function queryAlertApi(metricsUid: string) {
  return firstValueFrom(
    getBackendSrv().fetch<ListPrometheusAlertsResponse>({
      method: `GET`,
      url: `/api/prometheus/${metricsUid}/api/v1/rules`,
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

export function findRelevantAlertGroups(groups: PrometheusAlertsGroup[], alertFilter: AlertFilter) {
  return groups.reduce<PrometheusAlertsGroup[]>((acc, current) => {
    const relevantRules = current.rules.filter(alertFilter);

    if (relevantRules.length) {
      return [...acc, { ...current, rules: relevantRules }];
    }

    return acc;
  }, []);
}
