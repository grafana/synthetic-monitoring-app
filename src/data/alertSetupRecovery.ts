import { CheckAlertDraft } from 'types';

export function sameAlertSettings(left: CheckAlertDraft[], right: CheckAlertDraft[]): boolean {
  const normalize = (alerts: CheckAlertDraft[]) =>
    alerts
      .map(({ name, threshold, period, runbookUrl }) => ({
        name,
        threshold,
        period: period || '',
        runbookUrl: runbookUrl || '',
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

export function checkAlertRetryConflict(
  current: CheckAlertDraft[],
  previous: CheckAlertDraft[],
  desired: CheckAlertDraft[]
) {
  if (!sameAlertSettings(current, previous) && !sameAlertSettings(current, desired)) {
    throw new Error(
      'Alert settings changed since this save attempt. Open the check editor to review the current settings before retrying.'
    );
  }
}

export class AlertingConfirmationRequired extends Error {
  constructor(
    message: string,
    public proceed: () => Promise<Function | void>
  ) {
    super(message);
    this.name = 'AlertingConfirmationRequired';
  }
}

export class CheckAlertingSaveError extends Error {
  constructor(
    message: string,
    public retry: () => Promise<Function | void>,
    public continueToCheck: () => void
  ) {
    super(message);
    this.name = 'CheckAlertingSaveError';
  }
}
