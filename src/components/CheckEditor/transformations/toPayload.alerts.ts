import {
  AlertPercentiles,
  CheckAlert,
  CheckAlertFormRecord,
  CheckAlertFormType,
  CheckAlertFormValues,
  CheckAlertType,
} from 'types';

export function getAlertsPayload(formValues?: CheckAlertFormRecord, checkId?: number): CheckAlert[] {
  const alerts: CheckAlert[] = [];

  if (!checkId || !formValues) {
    return alerts;
  }

  for (const [alertType, alert] of Object.entries(formValues)) {
    if (alert.isSelected) {
      const alertNames = buildAlertNames(alertType as CheckAlertFormType, alert.percentiles);

      alertNames.forEach((alertName) => {
        alerts.push({
          id: checkId,
          name: alertName,
          threshold: alert.threshold!!,
        });
      });
    }
  }
  return alerts;
}

const buildAlertNames = (
  alertType: CheckAlertFormType,
  percentiles: CheckAlertFormValues['percentiles']
): CheckAlertType[] => {
  const alertNames: CheckAlertType[] = [];

  if ([CheckAlertFormType.HTTPRequestDurationTooHigh, CheckAlertFormType.PingICMPDurationTooHigh].includes(alertType)) {
    const newNames = appendPercentilesToName(alertType, percentiles);
    newNames.forEach((alertName) => {
      alertNames.push(alertName);
    });
  } else {
    alertNames.push(alertType as unknown as CheckAlertType);
  }

  return alertNames;
};

const appendPercentilesToName = (name: CheckAlertFormType, percentiles?: AlertPercentiles[]): CheckAlertType[] => {
  if (!percentiles?.length) {
    return [];
  }

  return percentiles.map((percentile) => `${name}${percentile}` as unknown as CheckAlertType);
};
