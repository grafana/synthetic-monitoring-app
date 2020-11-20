import { useState, useEffect } from 'react';
import { config, getBackendSrv } from '@grafana/runtime';
import { parse, stringify } from 'yaml';
import { SM_ALERTING_NAMESPACE } from 'components/constants';
import { AlertFormValues, AlertRule } from 'types';

const getRulerDatasource = () => config.datasources['grafanacloud-rdubrock-ruler'];

const fetchRulesForCheck = async (checkId: number) => {
  const ruler = getRulerDatasource();
  try {
    return await getBackendSrv()
      .fetch<any>({
        method: 'GET',
        url: `${ruler.url}/rules/${SM_ALERTING_NAMESPACE}/${checkId}`,
        headers: {
          'Content-Type': 'application/yaml',
        },
      })
      .toPromise()
      .then(response => {
        const alertGroup = parse(response.data);
        return alertGroup.rules;
      });
  } catch (e) {
    if (e.status === 404) {
      return [];
    }
    throw new Error(`Could not fetch alerting rules for check ${checkId}`);
  }
};

const deleteRulesForCheck = (checkId: number) => {
  const ruler = getRulerDatasource();
  return getBackendSrv()
    .fetch<any>({
      method: 'DELETE',
      url: `${ruler.url}/rules/${SM_ALERTING_NAMESPACE}/${checkId}`,
    })
    .toPromise();
};

export function useAlerts(checkId?: number) {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);

  const setRulesForCheck = async (checkId: number, alert: AlertFormValues, job: string, target: string) => {
    const ruler = getRulerDatasource();

    const ruleGroup = {
      name: checkId,
      rules: [
        {
          alert: alert.name,
          expr: `sum(1-probe_success{job="${job}", instance="${target}"}) by (job, instance)`,
          for: `${alert.timeCount}${alert.timeUnit.value}`,
          severity: alert.severity.value,
        },
      ],
    };

    const updateResponse = getBackendSrv()
      .fetch({
        url: `${ruler.url}/rules/syntheticmonitoring`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/yaml',
        },
        data: stringify(ruleGroup),
      })
      .toPromise();

    return updateResponse;
  };

  useEffect(() => {
    if (checkId) {
      fetchRulesForCheck(checkId).then(rules => {
        setAlertRules(rules);
      });
    }
  }, [checkId]);

  return { alertRules, setRulesForCheck, deleteRulesForCheck };
}
