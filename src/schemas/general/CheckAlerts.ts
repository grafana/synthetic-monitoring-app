import { z, ZodType } from 'zod';

import { CheckAlertFormRecord } from 'types';

const isScientificNotation = (val: number) => {
  return /e|E/.test(val.toString());
};

const emptyMessage = 'You need to set a threshold value';

const CheckAlertSchema = z
  .object({
    id: z.number().optional(),
    isSelected: z.boolean().optional(),
    period: z.string().optional(),
    threshold: z
      .number({ message: emptyMessage })
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
    { message: emptyMessage, path: ['threshold'] }
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
