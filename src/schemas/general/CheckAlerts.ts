import { z, ZodType } from 'zod';

import { CheckAlertFormRecord } from 'types';

const isScientificNotation = (val: number) => {
  return /e|E/.test(val.toString());
};

const CheckAlertSchema = z
  .object({
    id: z.number().optional(),
    isSelected: z.boolean().optional(),
    threshold: z
      .number()
      .optional()
      .refine((value) => !value || (value >= 0.01 && !isScientificNotation(value)), {
        message: 'Invalid threshold value',
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
    { message: 'You need to set a threshold value', path: ['threshold'] }
  );

const CheckAlertsPercentageSchema = CheckAlertSchema.and(
  z.object({
    threshold: z.number().max(100, { message: 'Threshold cannot exceed 100%' }),
  })
);

export const CheckAlertsSchema: ZodType<CheckAlertFormRecord | undefined> = z.object({
  ProbeFailedExecutionsTooHigh: CheckAlertsPercentageSchema.optional(),
  HTTPRequestDurationTooHighP50: CheckAlertSchema.optional(),
  HTTPRequestDurationTooHighP90: CheckAlertSchema.optional(),
  HTTPRequestDurationTooHighP95: CheckAlertSchema.optional(),
  HTTPRequestDurationTooHighP99: CheckAlertSchema.optional(),
  HTTPTargetCertificateCloseToExpiring: CheckAlertSchema.optional(),
  PingICMPDurationTooHighP50: CheckAlertSchema.optional(),
  PingICMPDurationTooHighP90: CheckAlertSchema.optional(),
  PingICMPDurationTooHighP95: CheckAlertSchema.optional(),
  PingICMPDurationTooHighP99: CheckAlertSchema.optional(),
});
