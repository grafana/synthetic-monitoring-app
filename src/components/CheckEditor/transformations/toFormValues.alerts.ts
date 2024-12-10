import { CheckAlertFormRecord, CheckAlertType } from 'types';
import { CheckAlertsResponse } from 'datasource/responses.types';

export function getAlertCheckFormValues(data: CheckAlertsResponse): CheckAlertFormRecord {
  const formAlerts: CheckAlertFormRecord = Object.keys(CheckAlertType).reduce((acc, alertTypeKey) => {
    const alertType = CheckAlertType[alertTypeKey as keyof typeof CheckAlertType];
    acc[alertType] = {
      id: undefined,
      threshold: 0, // Default threshold
      isSelected: false,
    };
    return acc;
  }, {} as CheckAlertFormRecord);

  data.alerts.forEach((alert) => {
    const alertType = Object.keys(CheckAlertType).find((type) => alert.name.includes(type));
    if (alertType) {
      const type = CheckAlertType[alertType as keyof typeof CheckAlertType];

      formAlerts[type] = {
        id: alert.id,
        threshold: alert.threshold,
        isSelected: true,
      };
    }
  });

  return formAlerts;
}
