import { durationToMilliseconds, parseDuration } from '@grafana/data';
import { getTotalChecksPerPeriod } from 'checkUsageCalc';
import { z, ZodType } from 'zod';

import { CheckAlertFormRecord, CheckFormValuesBase, CheckFormValuesTcp, CheckType } from 'types';
import { formatDuration } from 'utils';

const isScientificNotation = (val: number) => {
  return /e|E/.test(val.toString());
};

const invalidThreshold = 'Threshold value must be a valid integer';

const checkAlertSchema = z
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

const probeFailedExecutionsTooHighSchema = checkAlertSchema.refine(
  (data) => {
    if (data.isSelected && !data.period) {
      return false;
    }
    return true;
  },
  { message: 'You need to choose a period for this alert', path: ['period'] }
);

export const checkAlertsSchema: ZodType<CheckAlertFormRecord | undefined> = z.object({
  ProbeFailedExecutionsTooHigh: probeFailedExecutionsTooHighSchema.optional(),
  TLSTargetCertificateCloseToExpiring: checkAlertSchema.optional(),
});

function isCheckFormValuesTCP(data: CheckFormValuesBase | CheckFormValuesTcp): data is CheckFormValuesTcp {
  return 'checkType' in data && data.checkType === CheckType.TCP;
}

export function checkAlertsRefinement(data: CheckFormValuesBase | CheckFormValuesTcp, ctx: z.RefinementCtx) {
  probeFailedExecutionsRefinement(data, ctx);
  if (isCheckFormValuesTCP(data)) {
    tcpTLSTargetCertificateCloseToExpiringRefinement(data, ctx);
  }
}

function probeFailedExecutionsRefinement(data: CheckFormValuesBase, ctx: z.RefinementCtx) {
  const { probes } = data;
  const isSelected = data.alerts?.ProbeFailedExecutionsTooHigh?.isSelected;

  if (isSelected && probes.length) {
    checkThresholdIsValid(data, ctx);
    checkPeriodIsValid(data, ctx);
  }
}

function tcpTLSTargetCertificateCloseToExpiringRefinement(data: CheckFormValuesTcp, ctx: z.RefinementCtx) {
  const checkType = data.checkType;
  const isAlertSelected = data.alerts?.TLSTargetCertificateCloseToExpiring?.isSelected;
  const isTLSEnabled = data.settings?.tcp.tls;

  if (checkType === CheckType.TCP && isAlertSelected && !isTLSEnabled) {
    ctx.addIssue({
      path: ['alerts.TLSTargetCertificateCloseToExpiring.isSelected'],
      message: 'TLS must be enabled in Request options in order to collect the required TLS metrics for this alert',
      code: z.ZodIssueCode.custom,
    });
  }
}

function checkThresholdIsValid(data: CheckFormValuesBase, ctx: z.RefinementCtx) {
  const { frequency, probes } = data;
  const failedExecutionsAlertPeriod = data.alerts?.ProbeFailedExecutionsTooHigh?.period ?? '';
  const failedExecutionsAlertThreshold = data.alerts?.ProbeFailedExecutionsTooHigh?.threshold ?? 0;
  const failedExecutionAlertPeriod = durationToMilliseconds(parseDuration(failedExecutionsAlertPeriod));
  const totalChecksPerPeriod = getTotalChecksPerPeriod(probes.length, frequency, failedExecutionAlertPeriod);

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
  const failedExecutionAlertPeriod = durationToMilliseconds(parseDuration(failedExecutionsAlertPeriod));

  if (failedExecutionAlertPeriod < frequency) {
    ctx.addIssue({
      path: ['alerts.ProbeFailedExecutionsTooHigh.period'],
      message: `Period (${failedExecutionsAlertPeriod}) must be equal or higher to the frequency (${formatDuration(
        frequency
      )})`,
      code: z.ZodIssueCode.custom,
    });
  }
}
