import { useState, useEffect, useContext } from 'react';
import { getBackendSrv } from '@grafana/runtime';
import { parse, stringify } from 'yaml';
import { SM_ALERTING_NAMESPACE } from 'components/constants';
import { AlertFormValues, AlertRule, AlertSensitivity, Label } from 'types';
import { InstanceContext } from 'components/InstanceContext';

enum AlertThresholds {
  High = 0.95,
  Medium = 0.9,
  Low = 0.75,
}

const defaultRules = {
  name: 'default',
  rules: [
    {
      alert: 'High Sensitivity',
      expr: `probe_success * on (instance, job, probe, config_version) group_left (check_name) sm_check_info{alert_sensitivity="${AlertSensitivity.High}"} < ${AlertThresholds.High}`,
      for: '5m',
    },
    {
      alert: 'Medium Sensitivity',
      expr: `probe_success * on (instance, job, probe, config_version) group_left (check_name) sm_check_info{alert_sensitivity="${AlertSensitivity.Medium}"} < ${AlertThresholds.Medium}`,
      for: '5m',
    },
    {
      alert: 'Low Sensitivity',
      expr: `probe_success * on (instance, job, probe, config_version) group_left (check_name) sm_check_info{alert_sensitivity="${AlertSensitivity.Low}"} < ${AlertThresholds.Low}`,
      for: '5m',
    },
  ],
};

const fetchSMRules = async (alertRulerUrl: string) => {
  try {
    return await getBackendSrv()
      .fetch<any>({
        method: 'GET',
        url: `${alertRulerUrl}/rules/${SM_ALERTING_NAMESPACE}/default`,
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
    throw new Error(`Could not fetch alerting rules for Synthetic Monitoring`);
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
  const [defaultRulesSetCount, setDefaultRulesSetCount] = useState(0);
  const {
    instance: { alertRuler },
  } = useContext(InstanceContext);

  const alertRulerUrl = alertRuler?.url;

  const setDefaultRules = async () => {
    await getBackendSrv()
      .fetch({
        url: `${alertRulerUrl}/rules/syntheticmonitoring`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/yaml',
        },
        data: stringify(defaultRules),
      })
      .toPromise();

    setDefaultRulesSetCount(defaultRulesSetCount + 1);
  };

  const setRules = async (alerts: AlertFormValues[]) => {
    if (!alertRuler) {
      throw new Error('There is no alert ruler datasource configured for this Grafana instance');
    }

    const rules = alerts.map(alert => {
      const annotations = tranformFormValues(alert.annotations ?? []);
      const labels = tranformFormValues(alert.labels ?? []);
      if (alert.severity.value) {
        labels.severity = alert.severity.value;
      }

      return {
        alert: alert.name,
        // expr: `sum(1-probe_success{job="${job}", instance="${target}"}) by (job, instance) >= ${alert.probeCount}`,
        expr: 1,
        for: `${alert.timeCount}${alert.timeUnit.value}`,
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
    if (alertRulerUrl) {
      fetchSMRules(alertRulerUrl).then(rules => {
        setAlertRules(rules);
      });
    }
  }, [alertRulerUrl, defaultRulesSetCount]);

  return {
    alertRules,
    setDefaultRules,
    setRules,
    deleteRulesForCheck: getDeleteRulesForCheck(alertRulerUrl ?? ''),
  };
}
