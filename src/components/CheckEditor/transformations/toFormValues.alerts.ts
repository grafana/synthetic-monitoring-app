import { CheckAlertFormRecord, CheckAlertType } from 'types';
import { CheckAlertsResponse } from 'datasource/responses.types';
import { ALL_PREDEFINED_ALERTS } from 'components/CheckForm/AlertsPerCheck/AlertsPerCheck.constants';

export function getAlertCheckFormValues(data: CheckAlertsResponse): CheckAlertFormRecord {
  return Object.keys(CheckAlertType).reduce((acc, alertTypeKey) => {
    const alertType = CheckAlertType[alertTypeKey as keyof typeof CheckAlertType];

    const existingAlert = data.alerts.find((alert) => alert.name.includes(alertType));

    if (existingAlert) {
      acc[alertType] = {
        id: existingAlert.id,
        threshold: existingAlert.threshold,
        isSelected: true,
      };
    } else {
      acc[alertType] = {
        id: undefined,
        threshold: ALL_PREDEFINED_ALERTS.find((alert) => alert.type === alertType)?.default || 0,
        isSelected: false,
      };
    }

    return acc;
  }, {} as CheckAlertFormRecord);
}
