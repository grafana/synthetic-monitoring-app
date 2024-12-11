import { CheckAlertDraft, CheckAlertFormRecord, CheckAlertType } from 'types';

export function getAlertsPayload(formValues?: CheckAlertFormRecord, checkId?: number): CheckAlertDraft[] {
  const alerts: CheckAlertDraft[] = [];

  if (!checkId || !formValues) {
    return alerts;
  }

  for (const [alertType, alert] of Object.entries(formValues)) {
    if (alert.isSelected) {
      alerts.push({
        id: alert.id,
        name: alertType as CheckAlertType,
        threshold: alert.threshold!!,
      });
    }
  }
  return alerts;
}
