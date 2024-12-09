import { z, ZodType } from 'zod';

import { AlertPercentiles, CheckAlertFormRecord } from 'types';

const CheckAlertSchema = z
  .object({
    isSelected: z.boolean().optional(),
    threshold: z.number().optional(),
    percentiles: z.array(z.nativeEnum(AlertPercentiles)).optional(),
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

const CheckAlertSchemaWithPercentiles = CheckAlertSchema.refine(
  (data) => {
    if (!data.isSelected) {
      return true;
    }

    if (data.isSelected && !data.percentiles?.length) {
      return false;
    }
    return true;
  },
  { message: 'You need to set a percentile value', path: ['percentiles'] }
);

export const CheckAlertsSchema: ZodType<CheckAlertFormRecord | undefined> = z.object({
  ProbeFailedExecutionsTooHigh: CheckAlertSchema.optional(),
  HTTPRequestDurationTooHigh: CheckAlertSchemaWithPercentiles.optional(),
  HTTPTargetCertificateCloseToExpiring: CheckAlertSchema.optional(),
  PingICMPDurationTooHigh: CheckAlertSchemaWithPercentiles.optional(),
});
