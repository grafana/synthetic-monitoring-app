import { z } from 'zod';

export const JobSchema = z
  .string({
    required_error: 'Job name is required',
  })
  .min(1, { message: 'Job name is required' })
  .max(128, { message: 'Job name must be 128 characters or less' })
  .superRefine((value, ctx) => {
    if (value.includes("'") || value.includes(',') || value.includes('"')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Job names can't contain commas or quotes`,
      });
    }})
