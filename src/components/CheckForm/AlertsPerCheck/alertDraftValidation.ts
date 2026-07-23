import { durationToMilliseconds, parseDuration } from '@grafana/data';
import { getTotalChecksPerPeriod } from 'checkUsageCalc';

import { CheckAlertDraft, CheckAlertType } from 'types';
import { formatDuration } from 'utils';

export interface AlertDraftValidationErrors {
  period?: string;
  threshold?: string;
}

export function validateAlertDraft({
  draft,
  frequency,
  probeCount,
}: {
  draft: CheckAlertDraft;
  frequency: number;
  probeCount: number;
}): AlertDraftValidationErrors {
  const errors: AlertDraftValidationErrors = {};
  const requiresPeriod = draft.name !== CheckAlertType.TLSTargetCertificateCloseToExpiring;

  if (!Number.isInteger(draft.threshold) || draft.threshold < 1) {
    errors.threshold = 'Threshold must be a whole number of at least 1';
  }

  if (!draft.period && requiresPeriod) {
    errors.period = 'Choose a period for this alert';
    return errors;
  }

  if (!draft.period) {
    return errors;
  }

  const periodMs = durationToMilliseconds(parseDuration(draft.period));

  if (periodMs < frequency) {
    errors.period = `Period (${draft.period}) must be equal or higher to the frequency (${formatDuration(frequency)})`;
  }

  if (draft.name === CheckAlertType.ProbeFailedExecutionsTooHigh) {
    const totalChecksPerPeriod = getTotalChecksPerPeriod(probeCount, frequency, periodMs);

    if (!errors.threshold && totalChecksPerPeriod !== 0 && draft.threshold > totalChecksPerPeriod) {
      errors.threshold = `Threshold (${draft.threshold}) must be lower than or equal to the total number of checks per period (${totalChecksPerPeriod})`;
    }
  }

  return errors;
}
