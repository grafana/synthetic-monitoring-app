import { CheckAlertFormRecord, CheckAlertPublished } from 'types';

export function getCheckAlertsFormValues(alerts: CheckAlertPublished[]): CheckAlertFormRecord {
  const checkAlertFormValues: CheckAlertFormRecord = {};

  alerts.forEach((alert) => {
    checkAlertFormValues[alert.name] = {
      threshold: alert.threshold,
      period: alert.period,
      isSelected: true,
      status: alert.status,
      creationError: alert.error,
    };
  });

  return checkAlertFormValues;
}
