import { Check, CheckAlertPublished, CheckFormValues } from 'types';
import {
  GLOBAL_PREDEFINED_ALERTS,
  PredefinedAlertInterface,
} from 'components/CheckForm/AlertsPerCheck/AlertsPerCheck.constants';

import { getCheckAlertsFormValues } from './toFormValues.alerts';

export function getBaseFormValuesFromCheck(check: Check): Omit<CheckFormValues, 'checkType' | 'settings'> {
  return {
    alertSensitivity: check.alertSensitivity,
    publishAdvancedMetrics: !check.basicMetricsOnly,
    enabled: check.enabled,
    frequency: check.frequency,
    id: check.id,
    job: check.job,
    labels: check.labels,
    probes: check.probes,
    target: check.target,
    timeout: check.timeout,
    alerts: predefinedAlertsToFormValues(GLOBAL_PREDEFINED_ALERTS, check.alerts || []),
  };
}

export function predefinedAlertsToFormValues(
  predefinedAlerts: PredefinedAlertInterface[],
  alerts: CheckAlertPublished[]
) {
  const defaultValues = Object.values(predefinedAlerts).reduce((acc, alert) => {
    return {
      ...acc,
      [alert.type]: alert.defaultValues,
    };
  }, {});

  const checkAlertFormValues = getCheckAlertsFormValues(alerts);

  return {
    ...defaultValues,
    ...checkAlertFormValues,
  };
}
