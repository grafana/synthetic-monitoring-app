import { useContext, useEffect, useState } from 'react';
import { getBackendSrv } from '@grafana/runtime';
import { parse, stringify } from 'yaml';

import { AlertFamily, AlertRule, AlertSensitivity } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import {
  ALERT_PROBE_SUCCESS_RECORDING_EXPR,
  ALERT_PROBE_SUCCESS_RECORDING_METRIC,
  DEFAULT_ALERT_LABELS,
  DEFAULT_ALERT_NAMES_BY_FAMILY_AND_SENSITIVITY,
  getDefaultAlertAnnotations,
  SM_ALERTING_NAMESPACE,
} from 'components/constants';

import useGrafanaVersion from './useGrafanaVersion';
import useUnifiedAlertsEnabled from './useUnifiedAlertsEnabled';

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
      showErrorAlert: false,
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

const fetchSMRules = (metricInstanceIdentifier: string | number): Promise<RuleResponse> =>
  getBackendSrv()
    .fetch<any>({
      method: 'GET',
      url: `/api/ruler/${metricInstanceIdentifier}/api/v1/rules/${SM_ALERTING_NAMESPACE}/default`,
      showErrorAlert: false,
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

export function useAlerts() {
  const [alertRules, setAlertRules] = useState<AlertRule[]>();
  const [defaultRulesSetCount, setDefaultRulesSetCount] = useState(0);
  const [alertError, setAlertError] = useState('');
  const [metricsIdentifier, setMetricsIdentifier] = useState<string | number>('');
  const isUnifiedAlertsEnabled = useUnifiedAlertsEnabled();
  const { major: grafanaVersion } = useGrafanaVersion();
  const {
    instance: { alertRuler, metrics },
  } = useContext(InstanceContext);

  useEffect(() => {
    // There was a breaking change in the alert ruler api in Grafana v9. It switched from fetching by datasource ID to fetching by datasource UID.
    const id = grafanaVersion >= 9 ? metrics?.uid : metrics?.id;
    if (id) {
      setMetricsIdentifier(id);
    }
  }, [metrics?.id, metrics?.uid, grafanaVersion]);

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
        url: `/api/ruler/${metricsIdentifier}/api/v1/rules/${SM_ALERTING_NAMESPACE}`,
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
        url: `/api/ruler/${metricsIdentifier}/api/v1/rules/${SM_ALERTING_NAMESPACE}`,
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
    if (!metricsIdentifier) {
      return;
    }
    if (alertRulerUrl && !isUnifiedAlertsEnabled) {
      legacyFetchSMRules(alertRulerUrl).then(({ rules, error }) => {
        setAlertRules(rules);
        if (error) {
          setAlertError(error);
        }
      });
    } else if (isUnifiedAlertsEnabled && metrics) {
      // There was a breaking change in the alert ruler api in Grafana v9. It switched from fetching by datasource ID to fetching by datasource UID.
      fetchSMRules(metricsIdentifier).then(({ rules, error }) => {
        setAlertRules(rules);
        if (error) {
          setAlertError(error);
        }
      });
    }
  }, [alertRulerUrl, defaultRulesSetCount, isUnifiedAlertsEnabled, metrics, metricsIdentifier]);

  return {
    alertRules,
    alertError,
    setDefaultRules: isUnifiedAlertsEnabled ? setDefaultRules : legacySetDefaultRules,
    setRules: isUnifiedAlertsEnabled ? setRules : legacySetRules,
  };
}
