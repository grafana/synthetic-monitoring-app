import { checkAlertsRefinement, CheckAlertsSchema } from 'schemas/general/CheckAlerts';
import { CheckProbesSchema } from 'schemas/general/CheckProbes';
import { FrequencySchema } from 'schemas/general/Frequency';
import { JobSchema } from 'schemas/general/Job';
import { LabelsSchema } from 'schemas/general/Label';
import { z, ZodType } from 'zod';

import { AlertSensitivity, CheckFormValuesBase } from 'types';

export const BaseCheckSchema: ZodType<CheckFormValuesBase> = z
  .object({
    job: JobSchema,
    target: z.string(),
    frequency: FrequencySchema,
    id: z.number().optional(),
    timeout: z.number(),
    enabled: z.boolean(),
    probes: CheckProbesSchema,
    alertSensitivity: z.nativeEnum(AlertSensitivity),
    labels: LabelsSchema,
    publishAdvancedMetrics: z.boolean(),
    alerts: CheckAlertsSchema.optional(),
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
