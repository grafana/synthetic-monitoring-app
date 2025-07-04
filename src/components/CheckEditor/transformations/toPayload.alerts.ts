import { CheckAlertDraft, CheckAlertFormRecord, CheckAlertType } from 'types';

export function getAlertsPayload(formValues?: CheckAlertFormRecord, checkId?: number): CheckAlertDraft[] {
  if (!checkId || !formValues) {
    return [];
  }

  return Object.entries(formValues).reduce<CheckAlertDraft[]>((alerts, [alertType, alert]) => {
    if (alert.isSelected) {
      console.log(alert);
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
