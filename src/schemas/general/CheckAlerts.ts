import { durationToMilliseconds, parseDuration } from '@grafana/data';
import { getTotalChecksPerPeriod } from 'checkUsageCalc';
import { z, ZodType } from 'zod';

import { CheckAlertFormRecord, CheckFormValuesBase } from 'types';
import { secondsToDuration } from 'utils';

const isScientificNotation = (val: number) => {
  return /e|E/.test(val.toString());
};

const invalidThreshold = 'Threshold value must be a valid integer';

const CheckAlertSchema = z
  .object({
    id: z.number().optional(),
    isSelected: z.boolean().optional(),
    period: z.string().optional(),
    threshold: z
      .number({ message: invalidThreshold })
      .int({ message: invalidThreshold })
      .optional()
      .refine((value) => !value || (value >= 1 && !isScientificNotation(value)), {
        message: invalidThreshold,
      }),
  })
  .refine(
    (data) => {
      if (!data.isSelected) {
        return true;
      }

      if (data.isSelected && !data.threshold) {
        return false;
      }
      return true;
    },
    { message: invalidThreshold, path: ['threshold'] }
  );

const ProbeFailedExecutionsTooHighSchema = CheckAlertSchema.refine(
  (data) => {
    if (data.isSelected && !data.period) {
      return false;
    }
    return true;
  },
  { message: 'You need to choose a period for this alert', path: ['period'] }
);

export const CheckAlertsSchema: ZodType<CheckAlertFormRecord | undefined> = z.object({
  ProbeFailedExecutionsTooHigh: ProbeFailedExecutionsTooHighSchema.optional(),
  HTTPTargetCertificateCloseToExpiring: CheckAlertSchema.optional(),
});

export function checkAlertsRefinement(data: CheckFormValuesBase, ctx: z.RefinementCtx) {
  probeFailedExecutionsRefinement(data, ctx);
}

function probeFailedExecutionsRefinement(data: CheckFormValuesBase, ctx: z.RefinementCtx) {
  const { probes } = data;
  const isSelected = data.alerts?.ProbeFailedExecutionsTooHigh?.isSelected;

  if (isSelected && probes.length) {
    checkThresholdIsValid(data, ctx);
    checkPeriodIsValid(data, ctx);
  }
}

function checkThresholdIsValid(data: CheckFormValuesBase, ctx: z.RefinementCtx) {
  const { frequency, probes } = data;
  const failedExecutionsAlertPeriod = data.alerts?.ProbeFailedExecutionsTooHigh?.period ?? '';
  const failedExecutionsAlertThreshold = data.alerts?.ProbeFailedExecutionsTooHigh?.threshold ?? 0;
  const failedExecutionAlertPeriodInSeconds = durationToMilliseconds(parseDuration(failedExecutionsAlertPeriod)) / 1000;
  const totalChecksPerPeriod = getTotalChecksPerPeriod(probes.length, frequency, failedExecutionAlertPeriodInSeconds);

  if (totalChecksPerPeriod !== 0 && failedExecutionsAlertThreshold > totalChecksPerPeriod) {
    ctx.addIssue({
      path: ['alerts.ProbeFailedExecutionsTooHigh.threshold'],
      message: `Threshold (${failedExecutionsAlertThreshold}) must be lower than or equal to the total number of checks per period (${totalChecksPerPeriod})`,
      code: z.ZodIssueCode.custom,
    });
  }
}

function checkPeriodIsValid(data: CheckFormValuesBase, ctx: z.RefinementCtx) {
  const { frequency } = data;
  const failedExecutionsAlertPeriod = data.alerts?.ProbeFailedExecutionsTooHigh?.period ?? '';
  const failedExecutionAlertPeriodInSeconds = durationToMilliseconds(parseDuration(failedExecutionsAlertPeriod)) / 1000;

  if (failedExecutionAlertPeriodInSeconds < frequency) {
    ctx.addIssue({
      path: ['alerts.ProbeFailedExecutionsTooHigh.period'],
      message: `Period (${failedExecutionsAlertPeriod}) must be equal or higher to the frequency (${secondsToDuration(
        frequency
      )})`,
      code: z.ZodIssueCode.custom,
    });
  }
}
