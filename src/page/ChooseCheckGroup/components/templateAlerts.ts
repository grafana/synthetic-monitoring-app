import { CheckAlertDraft, CheckAlertType } from 'types';

// The template runs hourly. Match the wizard's supported one-hour evaluation
// window rather than its five-minute default for more frequent checks.
export const BROKEN_LINKS_ALERTS: CheckAlertDraft[] = [
  { name: CheckAlertType.ProbeFailedExecutionsTooHigh, threshold: 1, period: '1h' },
];

export const AGENTIC_JOURNEY_ALERTS: CheckAlertDraft[] = [
  { name: CheckAlertType.ProbeFailedExecutionsTooHigh, threshold: 1, period: '1h' },
];
