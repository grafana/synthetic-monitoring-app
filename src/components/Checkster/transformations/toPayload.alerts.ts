import { CheckAlertDraft, CheckAlertFormRecord, CheckAlertType } from 'types';

export function getAlertsPayload(formValues?: CheckAlertFormRecord): CheckAlertDraft[] {
  if (!formValues) {
    return [];
  }

  return Object.entries(formValues).reduce<CheckAlertDraft[]>((alerts, [alertType, alert]) => {
    if (alert.isSelected) {
      alerts.push({
        name: alertType as CheckAlertType,
        threshold: alert.threshold!,
        period: alert.period ? alert.period : undefined,
        runbookUrl: alert.runbookUrl || undefined,
      });
    }
    return alerts;
  }, []);
}
