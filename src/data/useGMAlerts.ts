import { type QueryKey, useQuery } from '@tanstack/react-query';
import { getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { Check, PrometheusAlertsGroup } from 'types';
import { ListPrometheusAlertsResponse } from 'datasource/responses.types';
import { ALL_PREDEFINED_ALERTS } from 'components/CheckForm/AlertsPerCheck/AlertsPerCheck.constants';

import { constructError, showAlert } from './utils';

const GRAFANA_SM_FOLDER_UID = 'grafana-synthetic-monitoring-app';

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

function findGroupWithMatchingRule(
  groups: PrometheusAlertsGroup[],
  alert: { name: string; period?: string }
): PrometheusAlertsGroup | undefined {
  const fullAlertName = alert.period ? `${alert.name} [${alert.period}]` : alert.name;
  return groups.find((group) => group.rules.some((rule) => rule.name === fullAlertName));
}

function extractMatchingRules(group: PrometheusAlertsGroup, alert: { name: string; period?: string }) {
  const fullAlertName = alert.period ? `${alert.name} [${alert.period}]` : alert.name;
  return group.rules.filter((rule) => rule.name === fullAlertName);
}

function constructDummyGroup(alertName: string): PrometheusAlertsGroup {
  const predefined = ALL_PREDEFINED_ALERTS.find((a) => a.type === alertName);
  const category = predefined?.category || '';
  return {
    evaulationTime: 0,
    file: 'Grafana Synthetic Monitoring',
    folderUid: 'grafana-synthetic-monitoring-app',
    interval: 0,
    lastEvaluation: '',
    name: category,
    rules: [
      {
        annotations: { description: '', summary: '' },
        duration: 0,
        evaluationTime: 0,
        health: 'ok',
        labels: {},
        lastEvaluation: '',
        name: alertName,
        query: '',
        state: 'inactive',
        type: 'alerting',
      },
    ],
    totals: null,
  };
}

export function findRelevantAlertGroups(
  groups: PrometheusAlertsGroup[],
  alerts: Check['alerts']
): PrometheusAlertsGroup[] {
  if (!alerts) {
    return [];
  }

  // Only consider groups with the correct folderUid
  const grafanaGroups = groups.filter((group) => group.folderUid === GRAFANA_SM_FOLDER_UID);

  return alerts.map((alert) => {
    const groupWithRule = findGroupWithMatchingRule(grafanaGroups, alert);
    if (groupWithRule) {
      return {
        ...groupWithRule,
        rules: extractMatchingRules(groupWithRule, alert),
      };
    }
    return constructDummyGroup(alert.name);
  });
}
