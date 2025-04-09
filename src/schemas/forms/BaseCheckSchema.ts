import { checkAlertsRefinement, checkAlertsSchema } from 'schemas/general/CheckAlerts';
import { checkProbesSchema } from 'schemas/general/CheckProbes';
import { frequencySchema } from 'schemas/general/Frequency';
import { jobSchema } from 'schemas/general/Job';
import { labelsSchema } from 'schemas/general/Label';
import { timeoutSchema } from 'schemas/general/Timeout';
import { z, ZodType } from 'zod';

import { AlertSensitivity, CheckFormValuesBase } from 'types';
import { formatDuration } from 'utils';

export const baseCheckSchema = z.object({
  job: jobSchema,
  target: z.string(),
  frequency: frequencySchema(),
  id: z.number().optional(),
  timeout: timeoutSchema(),
  enabled: z.boolean(),
  probes: checkProbesSchema,
  alertSensitivity: z.nativeEnum(AlertSensitivity),
  labels: labelsSchema,
  publishAdvancedMetrics: z.boolean(),
  alerts: checkAlertsSchema.optional(),
});

export function addRefinements(schema: ZodType<CheckFormValuesBase>) {
  return schema
    .superRefine((data, ctx) => {
      const { frequency, timeout } = data;
      if (frequency < timeout) {
        ctx.addIssue({
          path: ['frequency'],
          message: `Frequency must be greater than or equal to timeout (${formatDuration(timeout)})`,
          code: z.ZodIssueCode.custom,
        });
      }
    })
    .superRefine(checkAlertsRefinement);
}
