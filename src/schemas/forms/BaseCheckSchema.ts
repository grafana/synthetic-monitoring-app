import { checkAlertsRefinement, checkAlertsSchema } from 'schemas/general/CheckAlerts';
import { checkProbesSchema } from 'schemas/general/CheckProbes';
import { frequencySchema } from 'schemas/general/Frequency';
import { jobSchema } from 'schemas/general/Job';
import { labelsSchema } from 'schemas/general/Label';
import { z, ZodType } from 'zod';

import { AlertSensitivity, CheckFormValuesBase } from 'types';

export const baseCheckSchema: ZodType<CheckFormValuesBase> = z
  .object({
    job: jobSchema,
    target: z.string(),
    frequency: frequencySchema,
    id: z.number().optional(),
    timeout: z.number(),
    enabled: z.boolean(),
    probes: checkProbesSchema,
    alertSensitivity: z.nativeEnum(AlertSensitivity),
    labels: labelsSchema,
    publishAdvancedMetrics: z.boolean(),
    alerts: checkAlertsSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const { frequency, timeout } = data;
    if (frequency < timeout) {
      ctx.addIssue({
        path: ['frequency'],
        message: `Frequency must be greater than or equal to timeout (${timeout} seconds)`,
        code: z.ZodIssueCode.custom,
      });
    }
  })
  .superRefine(checkAlertsRefinement);
