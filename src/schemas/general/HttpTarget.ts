import { z } from 'zod';

import { validateHttpTarget } from 'validation';

import { TargetSchema } from './Target';

export const HttpTargetSchema = TargetSchema.and(z.string().superRefine(validate));

function validate(target: string, ctx: z.RefinementCtx) {
  const message = validateHttpTarget(target);

  if (message) {
    return ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message,
    });
  }
}
