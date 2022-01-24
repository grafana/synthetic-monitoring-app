import { useState, useEffect, useContext } from 'react';
import { getBackendSrv } from '@grafana/runtime';
import { parse, stringify } from 'yaml';
import {
  ALERT_PROBE_SUCCESS_RECORDING_EXPR,
  ALERT_PROBE_SUCCESS_RECORDING_METRIC,
  DEFAULT_ALERT_LABELS,
  DEFAULT_ALERT_NAMES_BY_FAMILY_AND_SENSITIVITY,
  SM_ALERTING_NAMESPACE,
  getDefaultAlertAnnotations,
} from 'components/constants';
import { AlertFamily, AlertRule, AlertSensitivity, FeatureName } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { useFeatureFlag } from './useFeatureFlag';

enum AlertThresholds {
  High = 95,
  Medium = 90,
  Low = 75,
}

export const defaultRules = {
  name: 'default',
  rules: [
    {
      record: ALERT_PROBE_SUCCESS_RECORDING_METRIC,
      expr: ALERT_PROBE_SUCCESS_RECORDING_EXPR,
    },
    {
      alert: DEFAULT_ALERT_NAMES_BY_FAMILY_AND_SENSITIVITY[AlertFamily.ProbeSuccess][AlertSensitivity.High],
      expr: `${ALERT_PROBE_SUCCESS_RECORDING_METRIC}{alert_sensitivity="${AlertSensitivity.High}"} < ${AlertThresholds.High}`,
      for: '5m',
      labels: DEFAULT_ALERT_LABELS,
      annotations: getDefaultAlertAnnotations(AlertThresholds.High),
    },
    {
      alert: DEFAULT_ALERT_NAMES_BY_FAMILY_AND_SENSITIVITY[AlertFamily.ProbeSuccess][AlertSensitivity.Medium],
      expr: `${ALERT_PROBE_SUCCESS_RECORDING_METRIC}{alert_sensitivity="${AlertSensitivity.Medium}"} < ${AlertThresholds.Medium}`,
      for: '5m',
      labels: DEFAULT_ALERT_LABELS,
      annotations: getDefaultAlertAnnotations(AlertThresholds.Medium),
    },
    {
      alert: DEFAULT_ALERT_NAMES_BY_FAMILY_AND_SENSITIVITY[AlertFamily.ProbeSuccess][AlertSensitivity.Low],
      expr: `${ALERT_PROBE_SUCCESS_RECORDING_METRIC}{alert_sensitivity="${AlertSensitivity.Low}"} < ${AlertThresholds.Low}`,
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

const legacyFetchSMRules = (alertRulerUrl: string): Promise<RuleResponse> =>
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
      const alertGroup = parse(response?.data);
      return { rules: alertGroup.rules };
    })
    .catch((e) => {
      if (e.status === 404) {
        return { rules: [] };
      }
      return { rules: [], error: e.data?.message ?? 'We ran into a problem and could not fetch the alert rules' };
    });

const fetchSMRules = (metricInstanceId: number): Promise<RuleResponse> =>
  getBackendSrv()
    .fetch<any>({
      method: 'GET',
      url: `/api/ruler/${metricInstanceId}/api/v1/rules/${SM_ALERTING_NAMESPACE}/default`,
    })
    .toPromise()
    .then((resp) => {
      return { rules: resp?.data?.rules ?? [] };
    })
    .catch((e) => {
      if (e.status === 404) {
        return { rules: [] };
      }
      return { rules: [], error: e.data?.message ?? 'We ran into a problem and could not fetch the alert rules' };
    });

export function useAlerts(checkId?: number) {
  const [alertRules, setAlertRules] = useState<AlertRule[]>();
  const [defaultRulesSetCount, setDefaultRulesSetCount] = useState(0);
  const [alertError, setAlertError] = useState('');
  const { isEnabled: isUnifiedAlertsEnabled } = useFeatureFlag(FeatureName.UnifiedAlerting);

  const {
    instance: { alertRuler, metrics },
  } = useContext(InstanceContext);

  const alertRulerUrl = alertRuler?.url;
  const legacySetDefaultRules = async () => {
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

  const setDefaultRules = async () => {
    if (!metrics) {
      return;
    }
    await getBackendSrv()
      .fetch({
        url: `/api/ruler/${metrics.id}/api/v1/rules/${SM_ALERTING_NAMESPACE}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: defaultRules,
      })
      .toPromise();

    setDefaultRulesSetCount(defaultRulesSetCount + 1);
  };

  const legacySetRules = async (rules: AlertRule[]) => {
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

  const setRules = async (rules: AlertRule[]) => {
    if (!metrics) {
      throw new Error('There is no alert ruler datasource configured for this Grafana instance');
    }

    const ruleGroup = {
      name: 'default',
      rules,
    };

    const updateResponse = getBackendSrv()
      .fetch({
        url: `/api/ruler/${metrics.id}/api/v1/rules/${SM_ALERTING_NAMESPACE}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: ruleGroup,
      })
      .toPromise();

    setDefaultRulesSetCount(defaultRulesSetCount + 1);

    return updateResponse;
  };

  useEffect(() => {
    if (alertRulerUrl && !isUnifiedAlertsEnabled) {
      legacyFetchSMRules(alertRulerUrl).then(({ rules, error }) => {
        setAlertRules(rules);
        if (error) {
          setAlertError(error);
        }
      });
    } else if (isUnifiedAlertsEnabled && metrics) {
      fetchSMRules(metrics.id).then(({ rules, error }) => {
        setAlertRules(rules);
        if (error) {
          setAlertError(error);
        }
      });
    }
  }, [alertRulerUrl, defaultRulesSetCount, isUnifiedAlertsEnabled, metrics]);

  return {
    alertRules,
    alertError,
    setDefaultRules: isUnifiedAlertsEnabled ? setDefaultRules : legacySetDefaultRules,
    setRules: isUnifiedAlertsEnabled ? setRules : legacySetRules,
  };
}
