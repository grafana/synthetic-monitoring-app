import { useState, useEffect, useContext } from 'react';
import { getBackendSrv } from '@grafana/runtime';
import { parse, stringify } from 'yaml';
import {
  ALERT_RECORDING_METRIC,
  DEFAULT_ALERT_LABELS,
  DEFAULT_ALERT_NAMES_BY_SENSITIVITY,
  SM_ALERTING_NAMESPACE,
  getDefaultAlertAnnotations,
} from 'components/constants';
import { AlertRule, AlertSensitivity } from 'types';
import { InstanceContext } from 'components/InstanceContext';

enum AlertThresholds {
  High = 0.95,
  Medium = 0.9,
  Low = 0.75,
}

export const defaultRules = {
  name: 'default',
  rules: [
    {
      record: ALERT_RECORDING_METRIC,
      expr: `(sum without(probe, config_version) (rate(probe_all_success_sum[5m]) *
              on(instance, job, probe) group_left(alert_sensitivity) max by(instance, job,
              probe, alert_sensitivity) (sm_check_info{alert_sensitivity!=""})) / sum
              without(probe, config_version) (rate(probe_all_success_count[5m]) *
              on(instance, job, probe) group_left(alert_sensitivity) max by(instance, job,
              probe, alert_sensitivity) (sm_check_info{alert_sensitivity!=""}))) * 100`,
    },
    {
      alert: DEFAULT_ALERT_NAMES_BY_SENSITIVITY[AlertSensitivity.High],
      expr: `${ALERT_RECORDING_METRIC}{alert_sensitivity="${AlertSensitivity.High}"} < ${AlertThresholds.High}`,
      for: '5m',
      labels: DEFAULT_ALERT_LABELS,
      annotations: getDefaultAlertAnnotations(AlertThresholds.High),
    },
    {
      alert: DEFAULT_ALERT_NAMES_BY_SENSITIVITY[AlertSensitivity.Medium],
      expr: `${ALERT_RECORDING_METRIC}{alert_sensitivity="${AlertSensitivity.Medium}"} < ${AlertThresholds.Medium}`,
      for: '5m',
      labels: DEFAULT_ALERT_LABELS,
      annotations: getDefaultAlertAnnotations(AlertThresholds.Medium),
    },
    {
      alert: DEFAULT_ALERT_NAMES_BY_SENSITIVITY[AlertSensitivity.Low],
      expr: `${ALERT_RECORDING_METRIC}{alert_sensitivity="${AlertSensitivity.Low}"} < ${AlertThresholds.Low}`,
      for: '5m',
      labels: DEFAULT_ALERT_LABELS,
      annotations: getDefaultAlertAnnotations(AlertThresholds.Low),
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

export function useAlerts(checkId?: number) {
  const [alertRules, setAlertRules] = useState<AlertRule[]>();
  const [defaultRulesSetCount, setDefaultRulesSetCount] = useState(0);
  const {
    instance: { alertRuler },
  } = useContext(InstanceContext);

  const alertRulerUrl = alertRuler?.url;
  const setDefaultRules = async () => {
    await getBackendSrv()
      .fetch({
        url: `${alertRulerUrl}/rules/${SM_ALERTING_NAMESPACE}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/yaml',
        },
        data: stringify(defaultRules),
      })
      .toPromise();

    setDefaultRulesSetCount(defaultRulesSetCount + 1);
  };

  const setRules = async (rules: AlertRule[]) => {
    if (!alertRuler) {
      throw new Error('There is no alert ruler datasource configured for this Grafana instance');
    }

    const ruleGroup = {
      name: 'default',
      rules,
    };

    const updateResponse = getBackendSrv()
      .fetch({
        url: `${alertRulerUrl}/rules/${SM_ALERTING_NAMESPACE}`,
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
