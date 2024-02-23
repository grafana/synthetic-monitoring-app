import { useContext } from 'react';
import { type QueryKey, useQuery } from '@tanstack/react-query';
import { DataSourceSettings } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { AlertRecord } from 'types';
import { AlertGroupResponse, ListDatasourceAlertsResponse } from 'datasource/responses.types';
import { InstanceContext } from 'contexts/InstanceContext';

export const queryKeys: Record<'list', QueryKey> = {
  list: ['alerts'],
};

type AlertFilter = (alert: AlertRecord) => boolean;

type AlertNameSpace = {
  namespace: string;
  groups: AlertGroupResponse[];
};

const alertFilter = (alert: AlertRecord) => {
  return alert.expr.includes(`alert_sensitivity`);
};

export function useAlerts() {
  const { instance } = useContext(InstanceContext);
  const metrics = instance.metrics as DataSourceSettings;

  return useQuery({
    queryKey: [...queryKeys.list, metrics.uid],
    queryFn: () => queryAlertApi(metrics.uid),
    select: (data) => {
      const reshapeData: AlertNameSpace[] = Object.entries(data).map(([namespace, groups]) => ({
        namespace,
        groups,
      }));

      return findRelevantAlerts(reshapeData, alertFilter);
    },
  });
}

function queryAlertApi(metricsUid: string) {
  return firstValueFrom(
    getBackendSrv().fetch<ListDatasourceAlertsResponse>({
      method: `GET`,
      url: `/api/ruler/${metricsUid}/api/v1/rules`,
    })
  ).then((res) => {
    return res.data;
  });
}

export function findRelevantAlerts(namespaces: AlertNameSpace[], alertFilter: AlertFilter) {
  return namespaces.reduce<AlertNameSpace[]>((acc, current) => {
    const { namespace, groups } = current;
    const relevantGroups = searchForRelevantGroups(groups, alertFilter);

    if (relevantGroups.length) {
      return [
        ...acc,
        {
          namespace,
          groups: relevantGroups,
        },
      ];
    }

    return acc;
  }, []);
}

function searchForRelevantGroups(groups: AlertGroupResponse[], alertFilter: AlertFilter) {
  return groups.reduce<AlertGroupResponse[]>((acc, current) => {
    const { name, rules } = current;

    const relevantRules = rules.filter(alertFilter);

    if (relevantRules.length) {
      return [
        ...acc,
        {
          name,
          rules: relevantRules,
        },
      ];
    }

    return acc;
  }, []);
}
