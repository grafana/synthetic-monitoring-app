import { z, ZodType } from 'zod';

import { CheckAlertFormRecord, ThresholdSelectorType } from 'types';

const isScientificNotation = (val: number) => {
  return /e|E/.test(val.toString());
};

const CheckAlertSchema = z
  .object({
    id: z.number().optional(),
    isSelected: z.boolean().optional(),
    thresholdUnit: z.nativeEnum(ThresholdSelectorType).optional(),
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

export const CheckAlertsSchema: ZodType<CheckAlertFormRecord | undefined> = z.object({
  ProbeFailedExecutionsTooHigh: CheckAlertSchema.optional().refine(
    (data) => {
      const baseCondition = data?.threshold && data?.threshold > 0;
      if (data?.thresholdUnit === '%') {
        return baseCondition && data?.threshold! <= 100;
      }
      return baseCondition;
    },
    { message: 'Threshold must be between 0 and 100% when the unit is %', path: ['threshold'] }
  ),
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
