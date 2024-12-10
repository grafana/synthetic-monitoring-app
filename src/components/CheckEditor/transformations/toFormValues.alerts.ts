import { AlertPercentiles, CheckAlertFormRecord, CheckAlertFormType } from 'types';
import { CheckAlertsResponse } from 'datasource/responses.types';

export function getAlertCheckFormValues(data: CheckAlertsResponse): CheckAlertFormRecord {
  const formAlerts: CheckAlertFormRecord = Object.keys(CheckAlertFormType).reduce((acc, alertTypeKey) => {
    const alertType = CheckAlertFormType[alertTypeKey as keyof typeof CheckAlertFormType];
    acc[alertType] = {
      id: undefined,
      threshold: 0, // Default threshold
      isSelected: false,
      percentiles: [],
    };
    return acc;
  }, {} as CheckAlertFormRecord);

  data.alerts.forEach((alert) => {
    const percentiles: AlertPercentiles[] = [];

    const alertType = Object.keys(CheckAlertFormType).find((type) => alert.name.includes(type));

    if (alertType) {
      const type = CheckAlertFormType[alertType as keyof typeof CheckAlertFormType];

      Object.values(AlertPercentiles).forEach((percentile) => {
        if (alert.name.includes(percentile)) {
          percentiles.push(percentile);
        }
      });

      const uniquePercentiles = Array.from(new Set(percentiles));

      formAlerts[type] = {
        id: alert.id,
        threshold: alert.threshold,
        isSelected: true,
        percentiles: [...(formAlerts[type]?.percentiles || []), ...uniquePercentiles],
      };
    }
  });

  return formAlerts;
}
