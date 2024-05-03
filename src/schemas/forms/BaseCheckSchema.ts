import { FrequencySchema } from 'schemas/general/Frequency';
import { JobSchema } from 'schemas/general/Job';
import { LabelsSchema } from 'schemas/general/Label';
import { ProbesSchema } from 'schemas/general/Probes';
import { z, ZodType } from 'zod';

import { CheckFormValuesBase } from 'types';

export const BaseCheckSchema: ZodType<CheckFormValuesBase> = z.object({
  job: JobSchema,
  target: z.string(),
  frequency: FrequencySchema,
  timeout: z.number(),
  enabled: z.boolean(),
  alertSensitivity: z.string(),
  probes: ProbesSchema,
  labels: LabelsSchema,
  publishAdvancedMetrics: z.boolean(),
});
