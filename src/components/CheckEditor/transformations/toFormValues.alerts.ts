import { CheckAlertFormRecord, CheckAlertType } from 'types';
import { CheckAlertsResponse } from 'datasource/responses.types';

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
        threshold: 0, // Default threshold
        isSelected: false,
      };
    }

    return acc;
  }, {} as CheckAlertFormRecord);
}
