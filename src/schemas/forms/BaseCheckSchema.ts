import { CheckProbesSchema } from 'schemas/general/CheckProbes';
import { FrequencySchema } from 'schemas/general/Frequency';
import { JobSchema } from 'schemas/general/Job';
import { LabelsSchema } from 'schemas/general/Label';
import { z, ZodType } from 'zod';

import { AlertSensitivity, CheckFormValuesBase } from 'types';

export const BaseCheckSchema: ZodType<CheckFormValuesBase> = z.object({
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
});
