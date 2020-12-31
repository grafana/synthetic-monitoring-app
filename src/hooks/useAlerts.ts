import { useState, useEffect, useContext } from 'react';
import { getBackendSrv } from '@grafana/runtime';
import { parse, stringify } from 'yaml';
import { SM_ALERTING_NAMESPACE } from 'components/constants';
import { AlertFormValues, AlertRule, Label } from 'types';
import { InstanceContext } from 'components/InstanceContext';

const fetchRulesForCheck = async (checkId: number, alertRulerUrl: string) => {
  try {
    return await getBackendSrv()
      .fetch<any>({
        method: 'GET',
        url: `${alertRulerUrl}/rules/${SM_ALERTING_NAMESPACE}/${checkId}`,
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

const getDeleteRulesForCheck = (datasourceUrl: string) => (checkId: number) => {
  return getBackendSrv()
    .fetch<any>({
      method: 'DELETE',
      url: `${datasourceUrl}/rules/${SM_ALERTING_NAMESPACE}/${checkId}`,
    })
    .toPromise();
};

const tranformFormValues = (values: Label[]) =>
  values.reduce<{ [key: string]: string }>((acc, { name, value }) => {
    acc[name] = value;
    return acc;
  }, {}) ?? {};

export function useAlerts(checkId?: number) {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(false);
  const {
    instance: { alertRuler },
  } = useContext(InstanceContext);

  const alertRulerUrl = alertRuler?.url;

  const setRulesForCheck = async (checkId: number, alerts: AlertFormValues[], job: string, target: string) => {
    if (!alertRuler) {
      throw new Error('There is no alert ruler datasource configured for this Grafana instance');
    }

    const rules = alerts.map(alert => {
      const annotations = tranformFormValues(alert.annotations ?? []);
      const labels = tranformFormValues(alert.labels ?? []);

      return {
        alert: alert.name,
        expr:
          alert.expression ||
          `sum(1-probe_success{job="${job}", instance="${target}"}) by (job, instance) >= ${alert.probeCount}`,
        for: `${alert.timeCount}${alert.timeUnit.value}`,
        severity: alert.severity.value,
        annotations,
        labels,
      };
    });

    const ruleGroup = {
      name: checkId,
      rules,
    };

    const updateResponse = getBackendSrv()
      .fetch({
        url: `${alertRulerUrl}/rules/syntheticmonitoring`,
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
    if (!checkId) {
      setAlertRules([]);
    }
    if (checkId && alertRulerUrl) {
      setLoading(true);
      fetchRulesForCheck(checkId, alertRulerUrl).then(rules => {
        setAlertRules(rules);
        setLoading(false);
      });
    }
  }, [checkId, alertRulerUrl]);

  return { alertRules, loading, setRulesForCheck, deleteRulesForCheck: getDeleteRulesForCheck(alertRulerUrl ?? '') };
}
