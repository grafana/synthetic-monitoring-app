import { z, ZodType } from 'zod';

import { CheckAlertFormRecord } from 'types';

const CheckAlertSchema = z
  .object({
    id: z.number().optional(),
    isSelected: z.boolean().optional(),
    threshold: z.number().optional(),
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
  ProbeFailedExecutionsTooHigh: CheckAlertSchema.optional(),
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