import { generateAlertLabels } from 'features/alerting/alertRoutingUtils';

import { Check, CheckAlertDraft, CheckAlertType } from 'types';
import { getCheckType } from 'utils';
import { LabelMode } from 'datasource/responses.types';

export function templateAlertLabels(check: Check, alert: CheckAlertDraft, labelMode: LabelMode) {
  return generateAlertLabels(alert.name, {
    checkType: getCheckType(check.settings),
    frequency: check.frequency,
    customLabels: check.labels,
    job: check.job,
    instance: check.target,
    labelMode,
    period: alert.period,
  });
}

// The template runs hourly. Match the wizard's supported one-hour evaluation
// window rather than its five-minute default for more frequent checks.
export const BROKEN_LINKS_ALERTS: CheckAlertDraft[] = [
  { name: CheckAlertType.ProbeFailedExecutionsTooHigh, threshold: 1, period: '1h' },
];
