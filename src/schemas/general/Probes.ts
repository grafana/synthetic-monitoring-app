import { z } from 'zod';

const MAX_PROBES = 64;

export const probesSchema = z
  .array(z.number(), { required_error: 'At least one probe is required' })
  .nonempty({
    message: 'At least one probe is required',
  })
  .superRefine((probes, ctx) => {
    if (probes.length > MAX_PROBES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `The maximum probe quantity is ${MAX_PROBES}, you have selected ${probes.length}`,
      });
    }
  });
