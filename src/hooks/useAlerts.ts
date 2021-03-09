import { useState, useEffect, useContext } from 'react';
import { getBackendSrv } from '@grafana/runtime';
import { parse, stringify } from 'yaml';
import {
  ALERT_RECORDING_EXPR,
  ALERT_RECORDING_METRIC,
  DEFAULT_ALERT_LABELS,
  DEFAULT_ALERT_NAMES_BY_SENSITIVITY,
  SM_ALERTING_NAMESPACE,
  getDefaultAlertAnnotations,
} from 'components/constants';
import { AlertRule, AlertSensitivity } from 'types';
import { InstanceContext } from 'components/InstanceContext';

enum AlertThresholds {
  High = 95,
  Medium = 90,
  Low = 75,
}

export const defaultRules = {
  name: 'default',
  rules: [
    {
      record: ALERT_RECORDING_METRIC,
      expr: ALERT_RECORDING_EXPR,
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

interface RuleResponse {
  rules: AlertRule[];
  error?: string;
}

const fetchSMRules = (alertRulerUrl: string): Promise<RuleResponse> =>
  getBackendSrv()
    .fetch<any>({
      method: 'GET',
      url: `${alertRulerUrl}/rules/${SM_ALERTING_NAMESPACE}/default`,
      headers: {
        'Content-Type': 'application/yaml',
      },
    })
    .toPromise()
    .then((response) => {
      const alertGroup = parse(response.data);
      return { rules: alertGroup.rules };
    })
    .catch((e) => {
      if (e.status === 404) {
        return { rules: [] };
      }
      return { rules: [], error: e.data?.message ?? 'We ran into a problem and could not fetch the alert rules' };
    });

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
  const [alertError, setAlertError] = useState('');
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

    setDefaultRulesSetCount(defaultRulesSetCount + 1);

    return updateResponse;
  };

  useEffect(() => {
    if (alertRulerUrl) {
      fetchSMRules(alertRulerUrl).then(({ rules, error }) => {
        setAlertRules(rules);
        if (error) {
          setAlertError(error);
        }
      });
    }
  }, [alertRulerUrl, defaultRulesSetCount]);

  return {
    alertRules,
    alertError,
    setDefaultRules,
    setRules,
    deleteRulesForCheck: getDeleteRulesForCheck(alertRulerUrl ?? ''),
  };
}
